import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, Plus, TrendingDown, TrendingUp, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency, formatAmount } from '../utils/currency';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import TransactionModal from '../components/TransactionModal';

const TransactionsPage = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Colores para el gráfico
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1'];

  // Función para obtener transacciones en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsList = [];
      querySnapshot.forEach((doc) => {
        transactionsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setTransactions(transactionsList);
      calculateChartData(transactionsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      toast.error('Error al cargar transacciones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Función para calcular datos del gráfico
  const calculateChartData = (transactionsList) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const categoryTotals = {};

    transactionsList.forEach(transaction => {
      const transactionDate = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date);
      const isCurrentMonth = transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;

      if (transaction.type === 'expense' && isCurrentMonth) {
        const category = transaction.category || 'Otros';
        categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
      }
    });

    const chartData = Object.entries(categoryTotals)
      .map(([name, value], index) => ({ 
        name, 
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    setChartData(chartData);
  };

  // Función para eliminar transacción
  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'transactions', transactionId));
      toast.success('Transacción eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error al eliminar la transacción');
    }
  };

  // Función para editar transacción
  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setShowTransactionModal(true);
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setShowTransactionModal(false);
    setTransactionToEdit(null);
  };

  // Función para formatear fecha
  const formatTransactionDate = (date) => {
    try {
      const transactionDate = date?.toDate ? date.toDate() : new Date(date);
      return format(transactionDate, 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Función para obtener el total de gastos del mes
  const getMonthlyExpenseTotal = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(transaction => {
        const transactionDate = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date);
        return transaction.type === 'expense' && 
               transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Componente de leyenda personalizada
  const CustomLegend = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <PieChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400">No hay gastos este mes</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white mb-4">Gastos por Categoría</h4>
        <div className="space-y-2">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-white font-medium">{entry.name}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">
                  {formatCurrency(entry.value)}
                </div>
                <div className="text-xs text-gray-400">
                  {((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-dark-600">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Total del mes:</span>
            <span className="text-white font-bold text-lg">
              {formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Componente de tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-purple-400">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando transacciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Transacciones</h1>
          <p className="text-gray-400 text-sm">Gestiona tus ingresos y gastos</p>
        </div>
        <button
          onClick={() => setShowTransactionModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva</span>
        </button>
      </div>

      {/* Resumen de Gastos del Mes */}
      <div className="bg-dark-800 rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-red-500/20 p-3 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Gastos del Mes</h3>
            <p className="text-gray-400 text-sm">
              {format(new Date(), 'MMMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold text-white">
          {formatCurrency(getMonthlyExpenseTotal())}
        </p>
      </div>

      {/* Gráfico de Gastos con Leyenda Personalizada */}
      {chartData.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-6">
            <PieChartIcon className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Distribución de Gastos</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Pastel */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Leyenda Personalizada */}
            <div className="flex items-center">
              <CustomLegend data={chartData} />
            </div>
          </div>
        </div>
      )}

      {/* Lista de Transacciones */}
      <div className="bg-dark-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Historial de Transacciones</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-card-strong p-8 rounded-xl max-w-md mx-auto">
              <div className="bg-gray-600/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <DollarSign className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                ¡Aún no tienes transacciones!
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Comienza registrando tus primeros ingresos y gastos para tener un control completo de tus finanzas.
              </p>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 mx-auto hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Primera Transacción</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-dark-700 rounded-lg p-4 hover:bg-dark-600 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-500/20' 
                        : 'bg-red-500/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium">{transaction.description}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{formatTransactionDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                        title="Editar transacción"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
                        title="Eliminar transacción"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón FAB */}
      <button
        onClick={() => setShowTransactionModal(true)}
        className="fixed bottom-24 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-[60]"
        title="Agregar nueva transacción"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal de Transacción */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={handleCloseModal}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default TransactionsPage;