import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

const InactivityModal = ({ isOpen, onStayLoggedIn, onLogout, timeRemaining = 0 }) => {
  const [countdown, setCountdown] = useState(Math.ceil(timeRemaining / 1000));

  // Actualizar countdown cada segundo
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    setCountdown(Math.ceil(timeRemaining / 1000));

    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newCount;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining]);

  // Formatear tiempo en minutos y segundos
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para manejar el clic en "Permanecer conectado"
  const handleStayLoggedIn = () => {
    onStayLoggedIn();
  };

  // Función para manejar el clic en "Cerrar sesión"
  const handleLogout = () => {
    onLogout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop con animación */}
      <div className="absolute inset-0 bg-black bg-opacity-75 animate-pulse"></div>

      {/* Modal */}
      <div className="relative bg-dark-800 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-red-500/20">
        {/* Header con icono de advertencia */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-500/20 p-4 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          ¿Sigues ahí?
        </h2>

        {/* Mensaje principal */}
        <p className="text-gray-300 text-center mb-6 leading-relaxed">
          Tu sesión se cerrará automáticamente por inactividad para proteger tu información financiera.
        </p>

        {/* Contador regresivo */}
        {countdown > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-mono text-lg">
                {formatTime(countdown)}
              </span>
            </div>
            <p className="text-red-300 text-sm text-center mt-2">
              Tiempo restante antes del cierre automático
            </p>
          </div>
        )}

        {/* Información de seguridad */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <p className="text-blue-300 text-sm text-center">
            <span className="font-medium">🔒 Seguridad:</span> Esta medida protege tu cuenta contra accesos no autorizados.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col space-y-3">
          {/* Botón principal - Permanecer conectado */}
          <button
            onClick={handleStayLoggedIn}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Permanecer Conectado</span>
          </button>

          {/* Botón secundario - Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Tu actividad ha sido detectada. Haz clic en cualquier botón para continuar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InactivityModal;
