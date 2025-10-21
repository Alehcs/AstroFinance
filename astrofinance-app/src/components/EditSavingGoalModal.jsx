import { useState, useEffect } from 'react';
import { X, Edit, Target, DollarSign } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';

const EditSavingGoalModal = ({ isOpen, onClose, goal }) => {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar datos del objetivo cuando se abre el modal
  useEffect(() => {
    if (goal) {
      setGoalName(goal.goalName || '');
      setTargetAmount(goal.targetAmount?.toString() || '');
    }
  }, [goal]);

  // Función para manejar cambios en el input del nombre
  const handleNameChange = (e) => {
    setGoalName(e.target.value);
  };

  // Función para manejar cambios en el input del monto objetivo
  const handleTargetAmountChange = (e) => {
    setTargetAmount(e.target.value);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!goal) {
      toast.error('Meta de ahorro no encontrada');
      return;
    }

    // Validaciones
    if (!goalName.trim()) {
      toast.error('El nombre de la meta es requerido');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      toast.error('El monto objetivo debe ser mayor a 0');
      return;
    }

    const newTargetAmount = parseFloat(targetAmount);
    
    if (newTargetAmount < goal.currentAmount) {
      toast.error('El monto objetivo no puede ser menor al monto actual');
      return;
    }

    try {
      setLoading(true);

      const goalRef = doc(db, 'savingGoals', goal.id);
      await updateDoc(goalRef, {
        goalName: goalName.trim(),
        targetAmount: newTargetAmount
      });

      toast.success('Meta actualizada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Error al actualizar la meta');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    if (!loading) {
      onClose();
      // Resetear formulario
      setGoalName('');
      setTargetAmount('');
    }
  };

  // Función para cerrar con Escape
  useEffect(() => {
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
  }, [isOpen]);

  if (!isOpen || !goal) return null;

  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
  const newProgressPercentage = targetAmount ? (goal.currentAmount / parseFloat(targetAmount)) * 100 : 0;

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
            <div className="bg-blue-600 p-2 rounded-lg">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Editar Meta</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información Actual */}
        <div className="bg-dark-700 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Meta Actual</h3>
          </div>
          
          {/* Progreso Actual */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Progreso actual</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-dark-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{formatCurrency(goal.currentAmount)}</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
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
                value={goalName}
                onChange={handleNameChange}
                placeholder="Ej: Viaje a Europa"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
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
                value={targetAmount}
                onChange={handleTargetAmountChange}
                placeholder="0"
                min={goal.currentAmount}
                step="1000"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Mínimo: {formatCurrency(goal.currentAmount)}
            </p>
          </div>

          {/* Vista Previa del Nuevo Progreso */}
          {targetAmount && parseFloat(targetAmount) > 0 && (
            <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-4">
              <h4 className="text-blue-300 font-medium mb-3">Vista Previa</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Nuevo objetivo:</span>
                  <span className="text-blue-400 font-medium">{formatCurrency(parseFloat(targetAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Nuevo progreso:</span>
                  <span className="text-white font-medium">
                    {newProgressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-dark-600 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(newProgressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !goalName.trim() || !targetAmount || parseFloat(targetAmount) < goal.currentAmount}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Edit className="w-5 h-5 mr-2" />
                  Actualizar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSavingGoalModal;
