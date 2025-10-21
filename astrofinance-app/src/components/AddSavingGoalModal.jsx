import { useState } from 'react';
import { X, Save, Target, DollarSign } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const AddSavingGoalModal = ({ isOpen, onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: '',
    currentAmount: '0'
  });

  const [loading, setLoading] = useState(false);

  // Función para manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Validaciones
    if (!formData.goalName.trim()) {
      toast.error('El nombre de la meta es requerido');
      return;
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      toast.error('El monto objetivo debe ser mayor a 0');
      return;
    }

    if (parseFloat(formData.currentAmount) < 0) {
      toast.error('El monto actual no puede ser negativo');
      return;
    }

    if (parseFloat(formData.currentAmount) > parseFloat(formData.targetAmount)) {
      toast.error('El monto actual no puede ser mayor al objetivo');
      return;
    }

    try {
      setLoading(true);

      const savingGoalData = {
        userId: currentUser.uid,
        goalName: formData.goalName.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'savingGoals'), savingGoalData);
      toast.success('Meta de ahorro creada exitosamente');
      onClose();
      
      // Resetear formulario
      setFormData({
        goalName: '',
        targetAmount: '',
        currentAmount: '0'
      });
    } catch (error) {
      console.error('Error saving saving goal:', error);
      toast.error('Error al crear la meta de ahorro');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    if (!loading) {
      onClose();
      // Resetear formulario al cerrar
      setFormData({
        goalName: '',
        targetAmount: '',
        currentAmount: '0'
      });
    }
  };

  // Función para cerrar con Escape
  useState(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
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
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-dark-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Nueva Meta de Ahorro</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la Meta */}
          <div>
            <label htmlFor="goalName" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de la Meta
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="goalName"
                name="goalName"
                value={formData.goalName}
                onChange={handleInputChange}
                placeholder="Ej: Viaje a Europa"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Monto Objetivo */}
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-300 mb-2">
              Monto Objetivo
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Monto Actual */}
          <div>
            <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-300 mb-2">
              Monto Actual (Opcional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="currentAmount"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Deja en 0 si empiezas desde cero
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Crear Meta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSavingGoalModal;
