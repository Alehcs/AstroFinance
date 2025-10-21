import { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { updateDoc, doc, addDoc, collection, serverTimestamp, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';

const MakeLoanPaymentModal = ({ isOpen, onClose, loan, totalBalance }) => {
  const { currentUser } = useAuth();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar datos del préstamo cuando se abre el modal
  useEffect(() => {
    if (loan) {
      // Establecer el pago sugerido como valor inicial
      setPaymentAmount(loan.monthlyPayment?.toString() || '');
    }
  }, [loan]);

  // Función para manejar cambios en el input del monto
  const handlePaymentAmountChange = (e) => {
    setPaymentAmount(e.target.value);
  };

  // Función para establecer el pago mínimo
  const handleSetMinimumPayment = () => {
    if (loan) {
      const minPayment = Math.min(loan.monthlyPayment, loan.remainingAmount || loan.totalAmount);
      setPaymentAmount(minPayment.toString());
    }
  };

  // Función para establecer el pago total (liquidar préstamo)
  const handleSetFullPayment = () => {
    if (loan) {
      setPaymentAmount((loan.remainingAmount || loan.totalAmount).toString());
    }
  };

  // Función para validar el monto del pago
  const validatePayment = () => {
    const amount = parseFloat(paymentAmount);
    const remainingAmount = loan.remainingAmount || loan.totalAmount;
    const minPayment = Math.min(loan.monthlyPayment, remainingAmount);

    if (!paymentAmount || amount <= 0) {
      return { isValid: false, error: 'El monto debe ser mayor a 0' };
    }

    if (amount > totalBalance) {
      return { isValid: false, error: 'Fondos insuficientes en tu saldo total' };
    }

    if (amount > remainingAmount) {
      return { isValid: false, error: 'El monto excede el saldo pendiente del préstamo' };
    }

    if (amount < minPayment && remainingAmount > minPayment) {
      return { isValid: false, error: `El pago mínimo es ${formatCurrency(minPayment)}` };
    }

    return { isValid: true };
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!loan) {
      toast.error('Préstamo no encontrado');
      return;
    }

    // Validar el pago
    const validation = validatePayment();
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const paymentAmountValue = parseFloat(paymentAmount);
    const currentRemainingAmount = loan.remainingAmount || loan.totalAmount;
    const newRemainingAmount = currentRemainingAmount - paymentAmountValue;

    try {
      setLoading(true);

      // Usar batch para hacer todas las operaciones atómicamente
      const batch = writeBatch(db);

      // 1. Crear transacción de gasto (pago de préstamo)
      const transactionsRef = collection(db, 'transactions');
      const transactionDocRef = doc(transactionsRef);
      batch.set(transactionDocRef, {
        userId: currentUser.uid,
        type: 'expense',
        amount: paymentAmountValue,
        description: `Pago de préstamo: ${loan.loanName}`,
        category: 'Préstamos',
        paymentMethod: 'Débito', // Asumimos que se paga con saldo disponible
        bankName: 'Pago de Préstamo',
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // 2. Actualizar el préstamo
      const loanRef = doc(db, 'loans', loan.id);
      const updateData = {
        remainingAmount: newRemainingAmount
      };

      // Si el préstamo se liquida completamente, cambiar el status
      if (newRemainingAmount <= 0) {
        updateData.status = 'paid';
        updateData.remainingAmount = 0;
      }

      batch.update(loanRef, updateData);

      // 3. Actualizar el saldo disponible del usuario (userFinancials)
      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      const userFinancialsSnap = await getDoc(userFinancialsRef);
      
      if (userFinancialsSnap.exists()) {
        const currentData = userFinancialsSnap.data();
        const newDebitBalance = Math.max(0, (currentData.debitBalance || 0) - paymentAmountValue);
        
        batch.update(userFinancialsRef, {
          debitBalance: newDebitBalance,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Si no existe el documento, crearlo con saldo inicial
        batch.set(userFinancialsRef, {
          userId: currentUser.uid,
          debitBalance: Math.max(0, totalBalance - paymentAmountValue),
          creditLimit: 0,
          usedCredit: 0,
          lastUpdated: serverTimestamp()
        });
      }

      // Ejecutar todas las operaciones atómicamente
      await batch.commit();

      // Notificación de éxito
      if (newRemainingAmount <= 0) {
        toast.success('¡Préstamo liquidado completamente! 🎉');
      } else {
        toast.success('Pago realizado exitosamente');
      }

      onClose();
      setPaymentAmount('');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    if (!loading) {
      onClose();
      setPaymentAmount('');
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

  if (!isOpen || !loan) return null;

  const remainingAmount = loan.remainingAmount || loan.totalAmount;
  const minPayment = Math.min(loan.monthlyPayment, remainingAmount);
  const validation = validatePayment();
  const isFullPayment = parseFloat(paymentAmount) >= remainingAmount;

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
            <div className="bg-green-600 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Realizar Pago</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información del Préstamo */}
        <div className="bg-dark-700 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <CreditCard className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">{loan.loanName}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Saldo Pendiente</div>
              <div className="text-lg font-bold text-red-400">{formatCurrency(remainingAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Pago Mensual Sugerido</div>
              <div className="text-lg font-bold text-orange-400">{formatCurrency(loan.monthlyPayment)}</div>
            </div>
          </div>
        </div>

        {/* Saldo Disponible */}
        <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Saldo Disponible:</span>
            <span className="text-white font-bold">{formatCurrency(totalBalance)}</span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto a Pagar */}
          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-300 mb-2">
              Monto a Pagar
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="paymentAmount"
                name="paymentAmount"
                value={paymentAmount}
                onChange={handlePaymentAmountChange}
                placeholder="0"
                min="0"
                step="1000"
                max={Math.min(remainingAmount, totalBalance)}
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Máximo: {formatCurrency(Math.min(remainingAmount, totalBalance))}
            </p>
          </div>

          {/* Botones de Pago Rápido */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSetMinimumPayment}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
            >
              Pago Mínimo ({formatCurrency(minPayment)})
            </button>
            <button
              type="button"
              onClick={handleSetFullPayment}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
            >
              Liquidar Total
            </button>
          </div>

          {/* Mensaje de Error */}
          {!validation.isValid && paymentAmount && (
            <div className="bg-red-600/20 border border-red-600 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-300 font-medium">Error de validación</p>
                <p className="text-red-400 text-sm">{validation.error}</p>
              </div>
            </div>
          )}

          {/* Información del Pago */}
          {paymentAmount && parseFloat(paymentAmount) > 0 && validation.isValid && (
            <div className={`border rounded-xl p-4 ${isFullPayment ? 'bg-green-600/20 border-green-600' : 'bg-green-600/20 border-green-600'}`}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Pago:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(parseFloat(paymentAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Nuevo saldo pendiente:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(remainingAmount - parseFloat(paymentAmount))}
                  </span>
                </div>
                {isFullPayment && (
                  <div className="flex items-center space-x-2 text-green-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>¡Préstamo se liquidará completamente!</span>
                  </div>
                )}
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
              disabled={loading || !paymentAmount || !validation.isValid}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isFullPayment ? 'Liquidar Préstamo' : 'Realizar Pago'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeLoanPaymentModal;
