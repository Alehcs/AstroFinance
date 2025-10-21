import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useIdleTimer from '../hooks/useIdleTimer';
import InactivityModal from '../components/InactivityModal';
import toast from 'react-hot-toast';

// Crear el contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para el sistema de inactividad
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [inactivityTimeRemaining, setInactivityTimeRemaining] = useState(0);

  // Función para crear documento de usuario en Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();

      try {
        await setDoc(userRef, {
          displayName,
          email,
          photoURL,
          createdAt,
          lastLoginAt: createdAt,
          ...additionalData
        });
        console.log('Documento de usuario creado en Firestore');
      } catch (error) {
        console.error('Error creando documento de usuario:', error);
      }
    } else {
      // Actualizar último acceso
      try {
        await setDoc(userRef, {
          lastLoginAt: new Date()
        }, { merge: true });
      } catch (error) {
        console.error('Error actualizando último acceso:', error);
      }
    }
  };

  // Función para obtener datos del usuario desde Firestore
  const getUserData = async (user) => {
    if (!user) return null;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      return null;
    }
  };

  // Función para registrar un nuevo usuario
  const signup = async (email, password, username = '') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Crear documento en Firestore
      await createUserDocument(user, { username });
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    }
  };

  // Función para iniciar sesión con email y contraseña
  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Login successful for user:', user.email);
      
      // Actualizar último acceso
      await createUserDocument(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login error:', error.code, error.message);
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    }
  };

  // Función para iniciar sesión con Google (usando popup para desarrollo)
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google sign-in...');
      const provider = new GoogleAuthProvider();
      
      // Configurar el proveedor para reducir warnings
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Agregar scopes adicionales si es necesario
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log('🔄 Opening Google popup...');
      // Usar popup para desarrollo local
      const result = await signInWithPopup(auth, provider);
      
      console.log('✅ Google sign-in successful:', result.user);
      return { success: true };
    } catch (error) {
      // Ignorar errores relacionados con popup cerrado por el usuario
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('ℹ️ Google sign-in cancelled by user');
        return { success: false, error: 'Autenticación cancelada' };
      }
      
      // Manejar específicamente el error de COOP
      if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
        console.log('⚠️ COOP policy error - this is usually harmless');
        // Intentar continuar con el flujo normal si el usuario ya está autenticado
        if (auth.currentUser) {
          return { success: true };
        }
        return { success: false, error: 'Error de configuración del navegador. Recarga la página e inténtalo de nuevo.' };
      }
      
      console.error('❌ Google sign-in error:', error);
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    }
  };


  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setShowInactivityModal(false);
      setInactivityTimeRemaining(0);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    }
  };

  // Función para manejar la inactividad (15 minutos)
  const handleFirstInactivity = () => {
    if (currentUser) {
      setShowInactivityModal(true);
      setInactivityTimeRemaining(15 * 60 * 1000); // 15 minutos en milisegundos
      toast.error('Tu sesión se cerrará por inactividad');
    }
  };

  // Función para manejar el cierre forzado por inactividad (30 minutos)
  const handleForceLogout = async () => {
    if (currentUser) {
      toast.error('Sesión cerrada por inactividad prolongada');
      await logout();
    }
  };

  // Función para permanecer conectado (reiniciar timers)
  const handleStayLoggedIn = () => {
    setShowInactivityModal(false);
    setInactivityTimeRemaining(0);
    toast.success('Sesión renovada');
  };

  // Hook para el primer timer (15 minutos - mostrar modal)
  useIdleTimer(
    15 * 60 * 1000, // 15 minutos
    handleFirstInactivity,
    !!currentUser && !showInactivityModal // Solo activo si hay usuario y no se muestra el modal
  );

  // Hook para el segundo timer (30 minutos - cerrar sesión forzadamente)
  useIdleTimer(
    30 * 60 * 1000, // 30 minutos
    handleForceLogout,
    !!currentUser // Solo activo si hay usuario
  );

  // Función para convertir códigos de error de Firebase a mensajes legibles
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña es muy débil';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido';
      case 'auth/user-not-found':
        return 'No se encontró una cuenta con este correo electrónico';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde';
      case 'auth/popup-closed-by-user':
        return 'El popup de autenticación fue cerrado';
      case 'auth/cancelled-popup-request':
        return 'La autenticación fue cancelada';
      default:
        return 'Ocurrió un error inesperado. Intenta nuevamente';
    }
  };

  // Efecto para escuchar cambios en el estado de autenticación

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth state changed:', user ? 'User logged in' : 'No user');
      setCurrentUser(user);
      
      if (user) {
        console.log('👤 User data:', user.email, user.uid);
        // Obtener datos adicionales del usuario desde Firestore
        const userDataFromFirestore = await getUserData(user);
        setUserData(userDataFromFirestore);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Valor del contexto
  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    signInWithGoogle,
    logout,
    getUserData,
    showInactivityModal,
    handleStayLoggedIn
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center galaxy-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Iniciando AstroFinance...</p>
            <p className="text-gray-400 text-sm mt-2">Verificando autenticación</p>
          </div>
        </div>
      ) : (
        children
      )}
      
      {/* Modal de inactividad */}
      <InactivityModal
        isOpen={showInactivityModal}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={logout}
        timeRemaining={inactivityTimeRemaining}
      />
    </AuthContext.Provider>
  );
};