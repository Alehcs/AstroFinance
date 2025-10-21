import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader2, Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, signInWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError('');
  };

  // Función para manejar el login con email y contraseña
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Firebase Auth solo acepta email, no username
      // Asumimos que el usuario está ingresando un email
      const result = await login(formData.emailOrUsername, formData.password);
      if (result.success) {
        // El usuario será redirigido automáticamente por el AuthContext
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el login con Google
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error);
      }
      // Si es exitoso, el usuario será redirigido automáticamente
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen galaxy-bg flex flex-col relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
      </div>

      {/* Header */}
      <div className="px-6 pt-8 pb-6 relative z-10">
        {/* Botón de regreso */}
        <Link 
          to="/welcome" 
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Volver al espacio
        </Link>

        {/* Título */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">
              Bienvenido de nuevo
            </h1>
            <p className="text-lg text-gray-300">
              Inicia sesión para continuar tu viaje financiero espacial
            </p>
            <div className="flex justify-center items-center space-x-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Regresa a tu base espacial</span>
              <Sparkles className="w-4 h-4 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Tarjeta del formulario con glassmorphism */}
          <div className="galaxy-glass-card-strong rounded-3xl p-8 space-y-6">
            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
          {/* Correo Electrónico o Nombre de Usuario */}
          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-300 mb-2">
              Correo Electrónico o Nombre de Usuario
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="emailOrUsername"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-gray-400 focus:outline-none"
                placeholder="tu@email.com o tu_usuario"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-3 glass-input rounded-xl text-white placeholder-gray-400 focus:outline-none"
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Recordarme y ¿Olvidé mi contraseña? */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                rememberMe ? 'bg-primary-600' : 'bg-dark-700'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  rememberMe ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
              <span className="ml-3 text-sm text-gray-300">Recordarme</span>
            </label>

            <Link 
              to="/forgot-password" 
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              ¿Olvidé mi contraseña?
            </Link>
          </div>

          {/* Botón de Inicio de Sesión */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full space-button text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 galaxy-glass-card rounded-full text-gray-400">O continúa con</span>
              </div>
            </div>

            {/* Botones de Redes Sociales */}
            <div className="space-y-3">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full glass-input hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
              </button>

            {/* Facebook deshabilitado por ahora - solo para mostrar el diseño */}
            <button 
              disabled={true}
              className="w-full bg-gray-600 cursor-not-allowed text-gray-400 font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continuar con Facebook (Próximamente)
            </button>
          </div>

            {/* Enlace a Registro */}
            <div className="text-center pt-6">
              <p className="text-gray-400">
                ¿No tienes una cuenta?{' '}
                <Link 
                  to="/signup" 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
