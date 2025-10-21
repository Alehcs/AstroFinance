// Utilidad para manejar errores de extensiones del navegador
// y otros errores no críticos

/**
 * Configura el manejo global de errores para suprimir errores
 * relacionados con extensiones del navegador
 */
export const setupErrorHandling = () => {
  // Suprimir errores específicos de extensiones del navegador
  const originalError = console.error;
  
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    // Lista de errores que queremos suprimir
    const suppressErrors = [
      'Unchecked runtime.lastError',
      'message port closed',
      'Extension context invalidated',
      'Receiving end does not exist',
      'Could not establish connection'
    ];
    
    // Verificar si el error debe ser suprimido
    const shouldSuppress = suppressErrors.some(error => 
      errorMessage.includes(error)
    );
    
    if (shouldSuppress) {
      // Solo loggear en desarrollo, no mostrar al usuario
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚫 Error de extensión suprimido:', errorMessage);
      }
      return;
    }
    
    // Loggear otros errores normalmente
    originalError.apply(console, args);
  };

  // Manejar errores no capturados
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.error?.message || '';
    
    // Suprimir errores de extensiones
    const suppressErrors = [
      'Unchecked runtime.lastError',
      'message port closed',
      'Extension context invalidated'
    ];
    
    const shouldSuppress = suppressErrors.some(error => 
      errorMessage.includes(error)
    );
    
    if (shouldSuppress) {
      event.preventDefault();
      return false;
    }
  });

  // Manejar promesas rechazadas no capturadas
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason || '';
    
    // Suprimir errores de extensiones
    const suppressErrors = [
      'Unchecked runtime.lastError',
      'message port closed',
      'Extension context invalidated'
    ];
    
    const shouldSuppress = suppressErrors.some(error => 
      errorMessage.includes(error)
    );
    
    if (shouldSuppress) {
      event.preventDefault();
      return false;
    }
  });
};

/**
 * Función para limpiar el manejo de errores
 */
export const cleanupErrorHandling = () => {
  // Restaurar console.error original si es necesario
  // Esto se puede llamar en useEffect cleanup
};
