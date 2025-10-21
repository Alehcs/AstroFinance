import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, CreditCard, Calendar, Trash2, CheckCircle, DollarSign, CreditCard as PaymentIcon } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import AddLoanModal from '../components/AddLoanModal';
import MakeLoanPaymentModal from '../components/MakeLoanPaymentModal';

const LoansPage = () => {
  const { currentUser } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);

  // Función para cargar el balance del usuario
  const loadUserBalance = async () => {
    if (!currentUser) return;
    
    try {
      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      const userFinancialsSnap = await getDoc(userFinancialsRef);
      
      if (userFinancialsSnap.exists()) {
        const data = userFinancialsSnap.data();
        setTotalBalance(data.debitBalance || 0);
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  // Función para obtener préstamos en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    // Cargar balance del usuario
    loadUserBalance();

    const loansRef = collection(db, 'loans');
    const q = query(
      loansRef,
      where('userId', '==', currentUser.uid),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loansList = [];
      querySnapshot.forEach((doc) => {
        loansList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setLoans(loansList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching loans:', error);
      toast.error('Error al cargar préstamos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Función para eliminar préstamo
  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este préstamo?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'loans', loanId));
      toast.success('Préstamo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast.error('Error al eliminar el préstamo');
    }
  };

  // Función para abrir modal de pago
  const handleMakePayment = (loan) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
  };

  // Función para cerrar modal de pago
  const handleClosePaymentModal = async () => {
    setShowPaymentModal(false);
    setSelectedLoan(null);
    // Recargar el balance después del pago
    await loadUserBalance();
  };

  // Función para calcular el total de deuda
  const getTotalDebt = () => {
    return loans.reduce((total, loan) => {
      return total + (loan.remainingAmount || (loan.totalAmount - (loan.installmentsPaid || 0) * loan.monthlyPayment));
    }, 0);
  };

  // Función para calcular el total pagado
  const getTotalPaid = () => {
    return loans.reduce((total, loan) => {
      return total + (loan.totalAmount - (loan.remainingAmount || loan.totalAmount));
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando préstamos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Préstamos</h1>
          <p className="text-gray-400 text-sm">
            {loans.length} préstamos registrados
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Préstamo</span>
        </button>
      </div>

      {/* Resumen General */}
      {loans.length > 0 && (
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-8 h-8" />
            <h2 className="text-xl font-bold">Resumen de Préstamos</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-orange-200 text-sm">Deuda Restante</p>
              <p className="text-2xl font-bold">{formatCurrency(getTotalDebt())}</p>
            </div>
            <div>
              <p className="text-orange-200 text-sm">Total Pagado</p>
              <p className="text-2xl font-bold">{formatCurrency(getTotalPaid())}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Préstamos */}
      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tienes préstamos registrados</h3>
            <p className="text-gray-400 mb-6">Registra tu primer préstamo para comenzar el seguimiento</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Registrar Primer Préstamo</span>
            </button>
          </div>
        ) : (
          loans.map((loan) => {
            // Usar remainingAmount si existe, sino calcularlo
            const currentRemainingAmount = loan.remainingAmount || (loan.totalAmount - (loan.installmentsPaid || 0) * loan.monthlyPayment);
            const totalPaid = loan.totalAmount - currentRemainingAmount;
            const progressPercentage = (totalPaid / loan.totalAmount) * 100;
            
            return (
              <div
                key={loan.id}
                className="bg-dark-800 rounded-xl p-6 hover:bg-dark-700 transition-colors duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{loan.loanName}</h3>
                      <p className="text-sm text-gray-400">
                        Monto original: {formatCurrency(loan.totalAmount)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteLoan(loan.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                    title="Eliminar préstamo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Información del Préstamo */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Pago Mensual Sugerido</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(loan.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Saldo Pendiente</p>
                    <p className="text-lg font-semibold text-red-400">{formatCurrency(currentRemainingAmount)}</p>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Progreso</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatCurrency(totalPaid)} pagado</span>
                    <span>{formatCurrency(loan.totalAmount)} total</span>
                  </div>
                </div>

                {/* Información y Botones */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-300">
                    {currentRemainingAmount <= 0 ? (
                      <span className="text-green-400 font-medium">¡Préstamo completado! 🎉</span>
                    ) : (
                      <span>Restante: {formatCurrency(currentRemainingAmount)}</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMakePayment(loan)}
                      disabled={currentRemainingAmount <= 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <PaymentIcon className="w-4 h-4" />
                      <span>Realizar Pago</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Botón FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-[60]"
        title="Registrar nuevo préstamo"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      <AddLoanModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        currentUser={currentUser}
      />

      {/* Modal de Realizar Pago */}
      <MakeLoanPaymentModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        loan={selectedLoan}
        totalBalance={totalBalance}
      />
    </div>
  );
};

export default LoansPage;
