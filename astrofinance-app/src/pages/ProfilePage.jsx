import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../firebase';
import { LogOut, User, Mail, Shield, Settings, Key, Star, Heart, Save, Edit3, Sparkles, RotateCcw } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  
  // Estados para el perfil
  const [profileData, setProfileData] = useState({
    displayName: '',
    avatarConfig: {
      seed: 'AstroUser',
      style: 'adventurer'
    }
  });
  
  // Estados para la edición
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Estados para el modal de reset
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Función para cargar el perfil del usuario
  const loadUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      setProfileLoading(true);
      const profileRef = doc(db, 'profiles', currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfileData({
          displayName: data.displayName || currentUser.displayName || '',
          avatarConfig: data.avatarConfig || {
            seed: currentUser.email?.split('@')[0] || 'AstroUser',
            style: 'adventurer'
          }
        });
      } else {
        // Crear perfil por defecto si no existe
        const defaultProfile = {
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
          avatarConfig: {
            seed: currentUser.email?.split('@')[0] || 'AstroUser',
            style: 'adventurer'
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(profileRef, defaultProfile);
        setProfileData(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  // Cargar perfil al montar el componente
  useEffect(() => {
    loadUserProfile();
  }, [currentUser]);

  // Función para manejar cambios en los campos
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para manejar cambios en la configuración del avatar
  const handleAvatarConfigChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      avatarConfig: {
        ...prev.avatarConfig,
        [field]: value
      }
    }));
  };

  // Función para guardar los cambios del perfil
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Actualizar el displayName en Firebase Auth
      await updateProfile(currentUser, {
        displayName: profileData.displayName
      });
      
      // Actualizar el documento en Firestore
      const profileRef = doc(db, 'profiles', currentUser.uid);
      await setDoc(profileRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  // Función para resetear todos los datos del usuario
  const handleResetData = async () => {
    try {
      setResetLoading(true);
      
      if (!currentUser) {
        toast.error('Usuario no autenticado');
        return;
      }

      // Lista de colecciones a limpiar
      const collectionsToClean = [
        'transactions',
        'savingGoals',
        'loans',
        'budgets',
        'recurringTransactions',
        'notifications'
      ];
      
      let totalDeleted = 0;
      
      // Limpiar cada colección usando batched writes
      for (const collectionName of collectionsToClean) {
        // Buscar todos los documentos del usuario en esta colección
        const snapshot = await getDocs(
          query(collection(db, collectionName), where('userId', '==', currentUser.uid))
        );
        
        if (snapshot.empty) {
          continue;
        }
        
        // Usar batched writes para eliminar documentos en lotes
        const batchSize = 500; // Límite de Firestore
        const docs = snapshot.docs;
        
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchDocs = docs.slice(i, i + batchSize);
          
          batchDocs.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          totalDeleted += batchDocs.length;
        }
      }
      
      // Eliminar el documento principal de userFinancials
      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      await deleteDoc(userFinancialsRef);
      
      // Eliminar el perfil del usuario
      const profileRef = doc(db, 'profiles', currentUser.uid);
      await deleteDoc(profileRef);
      
      toast.success(`¡Todos los datos han sido eliminados exitosamente! (${totalDeleted} documentos)`);
      
      // Cerrar el modal
      setShowResetModal(false);
      
      // Redirigir al usuario a la página de inicio después de un breve delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Error al resetear datos:', error);
      toast.error('Error al resetear los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setResetLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <p className="text-gray-400 text-sm">Personaliza tu cuenta y avatar</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
        </button>
      </div>

      {/* Información del Usuario */}
      <div className="bg-dark-800 rounded-xl p-6">
        <div className="flex items-center space-x-6 mb-6">
          {/* Avatar Personalizable */}
          <div className="relative">
            <UserAvatar 
              seed={profileData.avatarConfig.seed}
              style={profileData.avatarConfig.style}
              size={80}
              showBorder={true}
            />
            {isEditing && (
              <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-1">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ingresa tu nombre"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Semilla del Avatar
                  </label>
                  <input
                    type="text"
                    value={profileData.avatarConfig.seed}
                    onChange={(e) => handleAvatarConfigChange('seed', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Personaliza tu avatar"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Cambia este texto para generar un avatar único
                  </p>
                </div>
                
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-white">{profileData.displayName}</h2>
                <p className="text-gray-400">{currentUser?.email}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Cuenta verificada</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas del Usuario */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm">Miembro desde</span>
            </div>
            <p className="text-white font-semibold mt-1">
              {currentUser?.metadata?.creationTime ? 
                new Date(currentUser.metadata.creationTime).toLocaleDateString('es-CL') : 
                'No disponible'
              }
            </p>
          </div>
          
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 text-sm">Último acceso</span>
            </div>
            <p className="text-white font-semibold mt-1">
              {currentUser?.metadata?.lastSignInTime ? 
                new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('es-CL') : 
                'No disponible'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Vista Previa del Avatar */}
      {isEditing && (
        <div className="bg-dark-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Vista Previa del Avatar</h3>
          <div className="flex items-center space-x-4">
            <UserAvatar 
              seed={profileData.avatarConfig.seed}
              style={profileData.avatarConfig.style}
              size={120}
              showBorder={true}
            />
            <div className="text-gray-300">
              <p className="text-sm">Tu avatar se generará automáticamente basado en la semilla:</p>
              <p className="font-mono text-purple-400 mt-1">"{profileData.avatarConfig.seed}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Opciones de Configuración */}
      <div className="bg-dark-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuración</h3>
        
        <div className="space-y-3">
          {/* Cambiar Contraseña */}
          <button className="w-full bg-dark-700 hover:bg-dark-600 rounded-lg p-4 flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-gray-400" />
              <span className="text-white">Cambiar Contraseña</span>
            </div>
            <span className="text-gray-400 text-sm">Próximamente</span>
          </button>

          {/* Notificaciones */}
          <button className="w-full bg-dark-700 hover:bg-dark-600 rounded-lg p-4 flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-white">Notificaciones</span>
            </div>
            <span className="text-gray-400 text-sm">Próximamente</span>
          </button>

          {/* Gestionar Categorías */}
          <button className="w-full bg-dark-700 hover:bg-dark-600 rounded-lg p-4 flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <Star className="w-5 h-5 text-gray-400" />
              <span className="text-white">Gestionar Categorías</span>
            </div>
            <span className="text-gray-400 text-sm">Próximamente</span>
          </button>
        </div>
      </div>

      {/* Zona de Peligro */}
      <div className="bg-dark-800 rounded-xl p-6 border border-red-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <RotateCcw className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-400">Zona de Peligro</h3>
        </div>
        
        <p className="text-gray-300 text-sm mb-4">
          Las acciones en esta sección son irreversibles y afectarán permanentemente tus datos.
        </p>
        
        <button 
          onClick={() => setShowResetModal(true)}
          className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 hover:border-red-600/50 rounded-lg p-4 flex items-center justify-between transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <RotateCcw className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Resetear Todos los Datos</span>
          </div>
          <span className="text-red-400 text-sm">⚠️ Peligro</span>
        </button>
      </div>

      {/* Información de la App */}
      <div className="bg-dark-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Acerca de AstroFinance</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Versión</span>
            <span className="text-white">1.0.0</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Desarrollado con</span>
            <span className="text-white">React & Firebase</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Divisa</span>
            <span className="text-white">Pesos Chilenos (CLP)</span>
          </div>
        </div>
      </div>

      {/* Botón de Logout */}
      <div className="bg-dark-800 rounded-xl p-6">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center space-x-2 text-gray-400 mb-2">
          <Heart className="w-4 h-4 text-red-400" />
          <span className="text-sm">Hecho con amor para tu bienestar financiero</span>
        </div>
        <p className="text-xs text-gray-500">
          © 2024 AstroFinance. Todos los derechos reservados.
        </p>
      </div>

      {/* Modal de Confirmación para Reset */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetData}
        title="Resetear Todos los Datos"
        message="¿Estás seguro de que quieres eliminar TODOS tus datos financieros? Esta acción eliminará permanentemente:\n\n• Todos tus balances y saldos\n• Todas las transacciones\n• Todos los préstamos\n• Todas las metas de ahorro\n• Tu perfil personalizado\n\nEsta acción NO se puede deshacer."
        confirmText={resetLoading ? "Eliminando..." : "Confirmar, Borrar Todo"}
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ProfilePage;