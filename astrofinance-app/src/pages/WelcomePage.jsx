import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const WelcomePage = () => {
  return (
    <div className="min-h-screen galaxy-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
      </div>

      <div className="text-center space-y-12 max-w-lg w-full relative z-10">
        {/* Título */}
        <div className="space-y-8">
          {/* Título principal */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 leading-tight">
              AstroFinance
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Tu universo financiero al alcance de tus manos
            </p>
            <div className="flex justify-center items-center space-x-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Explora el espacio de las finanzas</span>
              <Sparkles className="w-4 h-4 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>

        {/* Tarjeta de acciones con glassmorphism */}
        <div className="galaxy-glass-card-strong rounded-3xl p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              Comienza tu viaje espacial
            </h2>
            <p className="text-gray-300">
              Únete a miles de usuarios que ya están explorando el futuro de las finanzas
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-4">
            <Link
              to="/signup"
              className="w-full space-button text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center text-lg group"
            >
              <span>Crear Cuenta</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            
            <Link
              to="/login"
              className="w-full glass-input text-white hover:text-blue-400 font-semibold py-4 px-6 rounded-xl flex items-center justify-center text-lg transition-all duration-200 hover:bg-white/10"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>

        {/* Características destacadas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="galaxy-glass-card rounded-2xl p-4">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="text-white font-medium mb-1">Rápido</h3>
            <p className="text-xs text-gray-400">Acceso instantáneo</p>
          </div>
          <div className="galaxy-glass-card rounded-2xl p-4">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="text-white font-medium mb-1">Seguro</h3>
            <p className="text-xs text-gray-400">Protección espacial</p>
          </div>
          <div className="galaxy-glass-card rounded-2xl p-4">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="text-white font-medium mb-1">Intuitivo</h3>
            <p className="text-xs text-gray-400">Fácil de usar</p>
          </div>
        </div>

        {/* Texto final */}
        <div className="pt-4">
          <p className="text-sm text-gray-400">
            Comienza tu viaje hacia el éxito financiero en el espacio
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
