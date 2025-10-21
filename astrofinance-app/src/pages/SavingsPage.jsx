import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Target, TrendingUp, Trash2, PiggyBank, Edit, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import AddSavingGoalModal from '../components/AddSavingGoalModal';
import ContributeToGoalModal from '../components/ContributeToGoalModal';
import WithdrawFromGoalModal from '../components/WithdrawFromGoalModal';
import EditSavingGoalModal from '../components/EditSavingGoalModal';

const SavingsPage = () => {
  const { currentUser } = useAuth();
  const [savingGoals, setSavingGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
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

  // Función para obtener metas de ahorro en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    // Cargar balance del usuario
    loadUserBalance();

    const savingGoalsRef = collection(db, 'savingGoals');
    const q = query(
      savingGoalsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const goalsList = [];
      querySnapshot.forEach((doc) => {
        goalsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setSavingGoals(goalsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching saving goals:', error);
      toast.error('Error al cargar metas de ahorro');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Función para eliminar meta de ahorro
  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta meta de ahorro?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'savingGoals', goalId));
      toast.success('Meta de ahorro eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting saving goal:', error);
      toast.error('Error al eliminar la meta de ahorro');
    }
  };

  // Función para abrir modal de aporte
  const handleContributeToGoal = (goal) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  };

  // Función para manejar retiro de meta
  const handleWithdrawFromGoal = (goal) => {
    setSelectedGoal(goal);
    setShowWithdrawModal(true);
  };

  // Función para manejar edición de meta
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowEditModal(true);
  };

  // Función para cerrar modal de aporte
  const handleCloseContributeModal = () => {
    setShowContributeModal(false);
    setSelectedGoal(null);
  };

  // Función para cerrar modal de retiro
  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
    setSelectedGoal(null);
  };

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedGoal(null);
  };

  // Función para calcular el total ahorrado
  const getTotalSaved = () => {
    return savingGoals.reduce((total, goal) => total + goal.currentAmount, 0);
  };

  // Función para calcular el total objetivo
  const getTotalTarget = () => {
    return savingGoals.reduce((total, goal) => total + goal.targetAmount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando metas de ahorro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Metas de Ahorro</h1>
          <p className="text-gray-400 text-sm">
            {savingGoals.length} metas registradas
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Resumen General */}
      {savingGoals.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <PiggyBank className="w-8 h-8" />
            <h2 className="text-xl font-bold">Resumen de Ahorros</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-purple-200 text-sm">Total Ahorrado</p>
              <p className="text-2xl font-bold">{formatCurrency(getTotalSaved())}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Meta Total</p>
              <p className="text-2xl font-bold">{formatCurrency(getTotalTarget())}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progreso General</span>
              <span>{((getTotalSaved() / getTotalTarget()) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-purple-400/30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getTotalSaved() / getTotalTarget()) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Metas */}
      <div className="space-y-4">
        {savingGoals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tienes metas de ahorro</h3>
            <p className="text-gray-400 mb-6">Crea tu primera meta para comenzar a ahorrar</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Primera Meta</span>
            </button>
          </div>
        ) : (
          savingGoals.map((goal) => {
            const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            
            return (
              <div
                key={goal.id}
                className="bg-dark-800 rounded-xl p-6 hover:bg-dark-700 transition-colors duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{goal.goalName}</h3>
                      <p className="text-sm text-gray-400">
                        Objetivo: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                    title="Eliminar meta"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Progreso</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>

                {/* Información y Botones */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-300">
                    {progressPercentage >= 100 ? (
                      <span className="text-green-400 font-medium">¡Meta completada! 🎉</span>
                    ) : (
                      <span>Faltan: {formatCurrency(remainingAmount)}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleContributeToGoal(goal)}
                      disabled={progressPercentage >= 100}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Aportar</span>
                    </button>
                    
                    <button
                      onClick={() => handleWithdrawFromGoal(goal)}
                      disabled={goal.currentAmount <= 0}
                      className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                    >
                      <Minus className="w-4 h-4" />
                      <span>Retirar</span>
                    </button>
                    
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
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
        className="fixed bottom-24 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-[60]"
        title="Crear nueva meta"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modales */}
      <AddSavingGoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        currentUser={currentUser}
      />

      <ContributeToGoalModal
        isOpen={showContributeModal}
        onClose={handleCloseContributeModal}
        goal={selectedGoal}
        totalBalance={totalBalance}
      />

      {/* Modal de Retiro */}
      <WithdrawFromGoalModal
        isOpen={showWithdrawModal}
        onClose={handleCloseWithdrawModal}
        goal={selectedGoal}
      />

      {/* Modal de Edición */}
      <EditSavingGoalModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        goal={selectedGoal}
      />
    </div>
  );
};

export default SavingsPage;
