import { useState } from 'react';
import { X, Minus, DollarSign, Target, AlertCircle } from 'lucide-react';
import { updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';

const WithdrawFromGoalModal = ({ isOpen, onClose, goal }) => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para manejar cambios en el input
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!goal) {
      toast.error('Meta de ahorro no encontrada');
      return;
    }

    // Validaciones
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    const newCurrentAmount = goal.currentAmount - withdrawalAmount;
    
    if (withdrawalAmount > goal.currentAmount) {
      toast.error('No puedes retirar más dinero del que tienes en esta meta');
      return;
    }

    if (newCurrentAmount < 0) {
      toast.error('El monto excede el dinero disponible en la meta');
      return;
    }

    try {
      setLoading(true);

      // 1. Actualizar la meta de ahorro
      const goalRef = doc(db, 'savingGoals', goal.id);
      await updateDoc(goalRef, {
        currentAmount: newCurrentAmount
      });

      // 2. Crear transacción de ingreso (retiro de meta)
      const transactionsRef = collection(db, 'transactions');
      await addDoc(transactionsRef, {
        userId: currentUser.uid,
        type: 'income',
        amount: withdrawalAmount,
        description: `Retiro de ${goal.goalName}`,
        category: 'Ahorros',
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      toast.success('Retiro realizado exitosamente');
      onClose();
      setAmount('');
    } catch (error) {
      console.error('Error withdrawing from goal:', error);
      toast.error('Error al realizar el retiro');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    if (!loading) {
      onClose();
      setAmount('');
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

  if (!isOpen || !goal) return null;

  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
  const availableAmount = goal.currentAmount;

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
            <div className="bg-orange-600 p-2 rounded-lg">
              <Minus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Retirar de Meta</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información de la Meta */}
        <div className="bg-dark-700 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Target className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">{goal.goalName}</h3>
          </div>
          
          {/* Progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Progreso actual</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-dark-600 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{formatCurrency(goal.currentAmount)}</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
        </div>

        {/* Dinero Disponible */}
        <div className="bg-orange-600/20 border border-orange-600 rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 font-medium">Dinero Disponible:</span>
            <span className="text-white font-bold">{formatCurrency(availableAmount)}</span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto a Retirar */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
              Monto a Retirar
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                min="0"
                step="1000"
                max={availableAmount}
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Máximo: {formatCurrency(availableAmount)}
            </p>
          </div>

          {/* Alerta de monto excedido */}
          {amount && parseFloat(amount) > availableAmount && (
            <div className="bg-red-600/20 border border-red-600 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-300 font-medium">Monto excedido</p>
                <p className="text-red-400 text-sm">
                  No puedes retirar más dinero del disponible. Disponible: {formatCurrency(availableAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Información del Retiro */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-orange-600/20 border border-orange-600 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Retiro:</span>
                  <span className="text-orange-400 font-medium">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Nuevo total:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(goal.currentAmount - parseFloat(amount))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Nuevo progreso:</span>
                  <span className="text-white font-medium">
                    {(((goal.currentAmount - parseFloat(amount)) / goal.targetAmount) * 100).toFixed(1)}%
                  </span>
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
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableAmount}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Minus className="w-5 h-5 mr-2" />
                  Retirar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawFromGoalModal;
