import React, { useEffect } from 'react';
import { X, AlertTriangle, Shield } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar Acción", 
  message = "¿Estás seguro de que quieres continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning" // "warning", "danger", "info"
}) => {
  // Configuración de colores según el tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-400',
          borderColor: 'border-red-500/30',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          accentColor: 'text-red-400'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-400',
          borderColor: 'border-blue-500/30',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          accentColor: 'text-blue-400'
        };
      default: // warning
        return {
          iconBg: 'bg-orange-500/20',
          iconColor: 'text-orange-400',
          borderColor: 'border-orange-500/30',
          buttonBg: 'bg-orange-600 hover:bg-orange-700',
          accentColor: 'text-orange-400'
        };
    }
  };

  const typeConfig = getTypeConfig();

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Manejar clic en backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={handleBackdropClick}
      ></div>

      {/* Modal */}
      <div className="relative bg-dark-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-dark-600 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${typeConfig.iconBg}`}>
              <AlertTriangle className={`w-6 h-6 ${typeConfig.iconColor}`} />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="mb-6">
          <div className={`p-4 rounded-xl bg-dark-700/50 border ${typeConfig.borderColor} mb-4`}>
            <p className="text-gray-300 leading-relaxed">{message}</p>
          </div>
          
          {/* Advertencia adicional para acciones peligrosas */}
          {type === 'danger' && (
            <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium text-sm">Acción irreversible</p>
                <p className="text-red-400 text-xs mt-1">
                  Esta acción no se puede deshacer. Todos los datos serán eliminados permanentemente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex-1 ${typeConfig.buttonBg} text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2`}
          >
            <span>{confirmText}</span>
            {type === 'danger' && <AlertTriangle className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer informativo */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Presiona <kbd className="px-2 py-1 bg-dark-700 rounded text-xs">Esc</kbd> para cancelar
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
