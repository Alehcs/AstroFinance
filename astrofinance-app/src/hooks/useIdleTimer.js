import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook personalizado para detectar inactividad del usuario
 * @param {number} timeout - Tiempo en milisegundos antes de considerar al usuario inactivo
 * @param {function} onIdle - Función a ejecutar cuando el usuario esté inactivo
 * @param {boolean} enabled - Si el timer está habilitado (por defecto true)
 * @returns {object} - Objeto con funciones para resetear y pausar el timer
 */
const useIdleTimer = (timeout = 900000, onIdle = () => {}, enabled = true) => {
  const timeoutId = useRef(null);
  const lastActivity = useRef(Date.now());

  // Función para resetear el timer
  const resetTimer = useCallback(() => {
    if (!enabled) return;
    
    lastActivity.current = Date.now();
    
    // Limpiar el timeout anterior si existe
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    
    // Establecer un nuevo timeout
    timeoutId.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivity.current;
      
      // Verificar si realmente ha pasado el tiempo de inactividad
      // (por si el usuario volvió a ser activo después de que se estableció el timeout)
      if (timeSinceLastActivity >= timeout) {
        onIdle();
      }
    }, timeout);
  }, [timeout, onIdle, enabled]);

  // Función para pausar el timer
  const pauseTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  // Función para reanudar el timer
  const resumeTimer = useCallback(() => {
    if (enabled) {
      resetTimer();
    }
  }, [resetTimer, enabled]);

  // Función para obtener el tiempo restante hasta la inactividad
  const getTimeRemaining = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivity.current;
    return Math.max(0, timeout - timeSinceLastActivity);
  }, [timeout]);

  // Función para obtener el tiempo transcurrido desde la última actividad
  const getTimeSinceLastActivity = useCallback(() => {
    return Date.now() - lastActivity.current;
  }, []);

  // Configurar los event listeners para detectar actividad
  useEffect(() => {
    if (!enabled) return;

    // Lista de eventos que indican actividad del usuario
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Función para manejar la actividad
    const handleActivity = () => {
      resetTimer();
    };

    // Agregar event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Inicializar el timer
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [resetTimer, enabled]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return {
    resetTimer,
    pauseTimer,
    resumeTimer,
    getTimeRemaining,
    getTimeSinceLastActivity
  };
};

export default useIdleTimer;
