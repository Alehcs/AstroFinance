import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { LogOut, Plus, CreditCard, PiggyBank, Wallet, DollarSign, Edit } from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import TransactionModal from '../components/TransactionModal';
import InitialSetupCard from '../components/InitialSetupCard';
import BalanceSetupModal from '../components/BalanceSetupModal';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { currentUser, logout } = useAuth();
  
  // Estados principales
  const [financialData, setFinancialData] = useState(null);
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para modales
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBalanceSetupModal, setShowBalanceSetupModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  // Función para obtener el nombre del usuario
  const getUserName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Usuario';
  };

  // Función simplificada para cargar datos financieros
  const loadUserFinancials = async () => {
    if (!currentUser) return;

    try {
      console.log('Cargando datos financieros para usuario:', currentUser.uid);
      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      const docSnap = await getDoc(userFinancialsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Datos financieros encontrados:', data);
        setFinancialData({
          debitBalance: data.debitBalance || 0,
          creditLimit: data.creditLimit || 0,
          usedCredit: data.usedCredit || 0
        });
      } else {
        console.log('No se encontraron datos financieros, inicializando...');
        setFinancialData({
          debitBalance: 0,
          creditLimit: 0,
          usedCredit: 0
        });
      }
    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
      setError('Error al cargar los datos financieros');
      setFinancialData({
        debitBalance: 0,
        creditLimit: 0,
        usedCredit: 0
      });
    }
  };

  // Función simplificada para cargar transacciones del mes
  const loadCurrentMonthTransactions = async () => {
    if (!currentUser) return;
    
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      console.log('Cargando transacciones del mes:', {
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString()
      });
      
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', currentUser.uid),
        where('date', '>=', startOfMonth),
        where('date', '<=', endOfMonth)
      );
      
      const querySnapshot = await getDocs(q);
      const transactionsList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactionsList.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        });
      });
      
      console.log('Transacciones encontradas:', transactionsList.length, transactionsList);
      setMonthlyTransactions(transactionsList);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      setError('Error al cargar las transacciones');
      setMonthlyTransactions([]);
    }
  };

  // Función para calcular el resumen
  const calculateSummary = () => {
    if (!financialData) {
      return {
        debitBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        availableCredit: 0
      };
    }

    // Calcular ingresos del mes
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calcular gastos del mes
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calcular cupo disponible
    const availableCredit = Math.max(0, (financialData.creditLimit || 0) - (financialData.usedCredit || 0));
    
    const summary = {
      debitBalance: financialData.debitBalance || 0,
      monthlyIncome,
      monthlyExpenses,
      availableCredit
    };

    console.log('Resumen calculado:', summary);
    return summary;
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadUserFinancials(),
          loadCurrentMonthTransactions()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Función para verificar si el usuario tiene datos financieros configurados
  const hasFinancialData = () => {
    return financialData && (financialData.debitBalance > 0 || financialData.creditLimit > 0);
  };

  // Función para abrir modal de configuración de balances
  const handleOpenBalanceSetup = (isInitial = false) => {
    setIsInitialSetup(isInitial);
    setShowBalanceSetupModal(true);
  };

  // Función para cerrar modal de configuración de balances
  const handleCloseBalanceSetup = async () => {
    setShowBalanceSetupModal(false);
    setIsInitialSetup(false);
    // Recargar datos después de cerrar el modal
    await loadUserFinancials();
  };

  // Función para manejar logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };


  // Función para abrir modal de nueva transacción
  const handleOpenTransactionModal = () => {
    setTransactionToEdit(null);
    setShowTransactionModal(true);
  };

  // Función para cerrar modal de transacción
  const handleCloseTransactionModal = async () => {
    setShowTransactionModal(false);
    setTransactionToEdit(null);
    // Recargar datos después de cerrar el modal
    await loadUserFinancials();
    await loadCurrentMonthTransactions();
  };


  // Componente de Skeleton Loader para las tarjetas
  const SkeletonCard = () => (
    <div className="glass-card-strong p-6 rounded-xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-600 rounded w-24"></div>
        <div className="h-6 bg-gray-600 rounded w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-600 rounded w-3/4"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 pb-24">
        {/* Header con skeleton */}
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-600 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-32"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-10 bg-gray-600 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton de tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const summary = calculateSummary();

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            ¡Hola, {getUserName()}! 👋
          </h1>
          <p className="text-gray-400 text-sm">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleLogout}
            className="bg-gray-600/50 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Resumen financiero */}
      {hasFinancialData() ? (
        <div className="space-y-6">
          {/* Header con botón de editar */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Resumen Financiero</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenBalanceSetup(false)}
                className="flex items-center space-x-2 bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors duration-200"
                title="Editar balances"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Editar</span>
              </button>
              
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard 
              title="Saldo Débito/Efectivo" 
              amount={summary.debitBalance}
              type="balance"
              icon="dollar"
            />
            <SummaryCard 
              title="Ingresos del Mes" 
              amount={summary.monthlyIncome}
              type="income"
              icon="trending-up"
            />
            <SummaryCard 
              title="Gastos del Mes" 
              amount={summary.monthlyExpenses}
              type="expense"
              icon="trending-down"
            />
            <SummaryCard 
              title="Cupo Disponible" 
              amount={summary.availableCredit}
              type="balance"
              icon="dollar"
            />
          </div>
        </div>
      ) : (
        /* Tarjeta de configuración inicial */
        <InitialSetupCard onSetupClick={() => handleOpenBalanceSetup(true)} />
      )}

      {/* Información de Crédito */}
      {financialData && financialData.creditLimit > 0 && (
        <div className="bg-dark-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Información de Crédito</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Wallet className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-400">
                {formatCurrency(financialData.creditLimit)}
              </p>
              <p className="text-gray-300 text-sm">Cupo Total</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <DollarSign className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(financialData.usedCredit)}
              </p>
              <p className="text-gray-300 text-sm">Crédito Usado</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <PiggyBank className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(summary.availableCredit)}
              </p>
              <p className="text-gray-300 text-sm">Disponible</p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="fixed bottom-24 right-6 flex flex-col space-y-3 z-[60]">
        {/* Botón principal de agregar */}
        <button 
          onClick={handleOpenTransactionModal}
          className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          title="Agregar transacción"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal de Transacción */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={handleCloseTransactionModal}
        transactionToEdit={transactionToEdit}
        currentUser={currentUser}
      />

      {/* Modal de Configuración de Balances */}
      <BalanceSetupModal
        isOpen={showBalanceSetupModal}
        onClose={handleCloseBalanceSetup}
        currentUser={currentUser}
        isInitialSetup={isInitialSetup}
      />

      {/* Información adicional para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-dark-800 rounded-xl p-4 text-xs text-gray-400">
          <details>
            <summary className="cursor-pointer mb-2">Debug Info (Solo desarrollo)</summary>
            <div className="space-y-2 mt-2">
              <p><strong>Usuario:</strong> {currentUser?.uid}</p>
              <p><strong>Datos Financieros:</strong> {JSON.stringify(financialData, null, 2)}</p>
              <p><strong>Transacciones del Mes:</strong> {monthlyTransactions.length}</p>
              <p><strong>Resumen:</strong> {JSON.stringify(summary, null, 2)}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default HomePage;