import { useState } from 'react';
import { X, Save, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const AddLoanModal = ({ isOpen, onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    loanName: '',
    totalAmount: '',
    installments: '',
    installmentsPaid: '0'
  });

  const [loading, setLoading] = useState(false);

  // Función para calcular el pago mensual automáticamente
  const calculateMonthlyPayment = () => {
    const total = parseFloat(formData.totalAmount) || 0;
    const installments = parseInt(formData.installments) || 0;
    
    if (total > 0 && installments > 0) {
      return Math.round(total / installments);
    }
    return 0;
  };

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
    if (!formData.loanName.trim()) {
      toast.error('El nombre del préstamo es requerido');
      return;
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      toast.error('El monto total debe ser mayor a 0');
      return;
    }

    if (!formData.installments || parseInt(formData.installments) <= 0) {
      toast.error('El número de cuotas debe ser mayor a 0');
      return;
    }

    if (parseInt(formData.installmentsPaid) < 0) {
      toast.error('Las cuotas pagadas no pueden ser negativas');
      return;
    }

    if (parseInt(formData.installmentsPaid) > parseInt(formData.installments)) {
      toast.error('Las cuotas pagadas no pueden ser mayores al total');
      return;
    }

    try {
      setLoading(true);

      const monthlyPayment = calculateMonthlyPayment();

      const totalAmount = parseFloat(formData.totalAmount);
      const installmentsPaid = parseInt(formData.installmentsPaid);
      const remainingAmount = totalAmount - (installmentsPaid * monthlyPayment);

      const loanData = {
        userId: currentUser.uid,
        loanName: formData.loanName.trim(),
        totalAmount: totalAmount,
        remainingAmount: Math.max(0, remainingAmount),
        installments: parseInt(formData.installments),
        monthlyPayment: monthlyPayment,
        status: remainingAmount <= 0 ? 'paid' : 'active',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'loans'), loanData);
      toast.success('Préstamo registrado exitosamente');
      onClose();
      
      // Resetear formulario
      setFormData({
        loanName: '',
        totalAmount: '',
        installments: '',
        installmentsPaid: '0'
      });
    } catch (error) {
      console.error('Error saving loan:', error);
      toast.error('Error al registrar el préstamo');
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
        loanName: '',
        totalAmount: '',
        installments: '',
        installmentsPaid: '0'
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
            <div className="bg-orange-600 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Nuevo Préstamo</h2>
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
          {/* Nombre del Préstamo */}
          <div>
            <label htmlFor="loanName" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Préstamo
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="loanName"
                name="loanName"
                value={formData.loanName}
                onChange={handleInputChange}
                placeholder="Ej: Préstamo para vehículo"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Monto Total */}
          <div>
            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-300 mb-2">
              Monto Total
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="totalAmount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Número de Cuotas */}
          <div>
            <label htmlFor="installments" className="block text-sm font-medium text-gray-300 mb-2">
              Número de Cuotas
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="installments"
                name="installments"
                value={formData.installments}
                onChange={handleInputChange}
                placeholder="24"
                min="1"
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Cuotas Pagadas */}
          <div>
            <label htmlFor="installmentsPaid" className="block text-sm font-medium text-gray-300 mb-2">
              Cuotas Pagadas (Opcional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="installmentsPaid"
                name="installmentsPaid"
                value={formData.installmentsPaid}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                max={formData.installments}
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Deja en 0 si no has pagado ninguna cuota
            </p>
          </div>

          {/* Información del Pago Mensual */}
          {calculateMonthlyPayment() > 0 && (
            <div className="bg-orange-600/20 border border-orange-600 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-medium">
                  Pago mensual: ${calculateMonthlyPayment().toLocaleString('es-CL')}
                </span>
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
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Registrar Préstamo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanModal;
