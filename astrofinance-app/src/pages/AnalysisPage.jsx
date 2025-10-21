import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import InsightCard from '../components/InsightCard';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Calendar,
  Coffee,
  CreditCard,
  PiggyBank,
  Zap
} from 'lucide-react';

const AnalysisPage = () => {
  const { currentUser } = useAuth();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  // Función para obtener datos de análisis
  const fetchAnalysisData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Obtener todas las transacciones del usuario (simplificado para evitar problemas de índices)
      const transactionsRef = collection(db, 'transactions');
      const transactionsQuery = query(
        transactionsRef,
        where('userId', '==', currentUser.uid)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      let transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));

      // Filtrar transacciones de los últimos 6 meses en el cliente
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      transactionsData = transactionsData.filter(transaction => 
        transaction.date >= sixMonthsAgo
      ).sort((a, b) => b.date - a.date);

      // Obtener metas de ahorro
      const savingsRef = collection(db, 'savingGoals');
      const savingsQuery = query(
        savingsRef,
        where('userId', '==', currentUser.uid)
      );
      
      const savingsSnapshot = await getDocs(savingsQuery);
      const savingsData = savingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAnalysisData({
        transactions: transactionsData,
        savingsGoals: savingsData
      });

    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para analizar patrones de gasto fin de semana vs semana
  const analyzeWeekendPatterns = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    let weekdayTotal = 0;
    let weekendTotal = 0;
    let weekdayCount = 0;
    let weekendCount = 0;

    expenses.forEach(transaction => {
      const date = transaction.createdAt?.toDate?.() || new Date(transaction.createdAt);
      const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo o Sábado
      
      if (isWeekend) {
        weekendTotal += transaction.amount || 0;
        weekendCount++;
      } else {
        weekdayTotal += transaction.amount || 0;
        weekdayCount++;
      }
    });

    const weekdayAverage = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
    const weekendAverage = weekendCount > 0 ? weekendTotal / weekendCount : 0;
    
    const percentageDifference = weekdayAverage > 0 
      ? ((weekendAverage - weekdayAverage) / weekdayAverage) * 100 
      : 0;

    return {
      weekdayAverage,
      weekendAverage,
      percentageDifference,
      weekendCount,
      weekdayCount
    };
  };

  // Función para identificar categorías "hormiga"
  const identifyAntExpenses = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const smallExpenses = expenses.filter(t => (t.amount || 0) <= 5000);
    
    const categoryCounts = {};
    smallExpenses.forEach(expense => {
      const category = expense.category || 'Sin categoría';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a);

    return {
      topCategory: sortedCategories[0]?.[0] || 'N/A',
      count: sortedCategories[0]?.[1] || 0,
      totalSmallExpenses: smallExpenses.length
    };
  };

  // Función para analizar suscripciones y gastos recurrentes
  const analyzeRecurringExpenses = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // Buscar patrones de gastos similares
    const recurringPatterns = {};
    
    expenses.forEach(expense => {
      const description = expense.description?.toLowerCase() || '';
      const category = expense.category || 'Sin categoría';
      
      // Palabras clave que sugieren suscripciones
      const subscriptionKeywords = ['netflix', 'spotify', 'youtube', 'premium', 'suscripción', 'subscription', 'mensual', 'anual'];
      
      const isSubscription = subscriptionKeywords.some(keyword => 
        description.includes(keyword)
      );
      
      if (isSubscription) {
        const key = `${category}_${description}`;
        if (!recurringPatterns[key]) {
          recurringPatterns[key] = {
            category,
            description: expense.description,
            total: 0,
            count: 0,
            average: 0
          };
        }
        recurringPatterns[key].total += expense.amount || 0;
        recurringPatterns[key].count += 1;
      }
    });

    // Calcular promedios
    Object.values(recurringPatterns).forEach(pattern => {
      pattern.average = pattern.total / pattern.count;
    });

    const totalRecurring = Object.values(recurringPatterns)
      .reduce((sum, pattern) => sum + pattern.total, 0);

    return {
      patterns: recurringPatterns,
      totalRecurring,
      count: Object.keys(recurringPatterns).length
    };
  };

  // Función para calcular ahorro mensual promedio
  const calculateMonthlySavings = (transactions) => {
    const last3Months = new Date();
    last3Months.setMonth(last3Months.getMonth() - 3);
    
    const recentTransactions = transactions.filter(t => {
      const date = t.createdAt?.toDate?.() || new Date(t.createdAt);
      return date >= last3Months;
    });

    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      monthlyIncome: totalIncome / 3,
      monthlyExpenses: totalExpenses / 3,
      monthlySavings: (totalIncome - totalExpenses) / 3
    };
  };

  // Función para generar sugerencias inteligentes
  const generateInsights = (analysisData) => {
    if (!analysisData) return [];

    const insights = [];
    const { transactions, savingsGoals } = analysisData;

    // Análisis de patrones de fin de semana
    const weekendAnalysis = analyzeWeekendPatterns(transactions);
    if (Math.abs(weekendAnalysis.percentageDifference) > 20) {
      insights.push({
        type: weekendAnalysis.percentageDifference > 0 ? 'warning' : 'success',
        title: 'Patrón de Gastos Fin de Semana',
        description: `Tus gastos en fines de semana son ${Math.abs(weekendAnalysis.percentageDifference).toFixed(0)}% ${
          weekendAnalysis.percentageDifference > 0 ? 'mayores' : 'menores'
        } que en días de semana.`,
        metric: `$${weekendAnalysis.weekendAverage.toLocaleString('es-CL')}`,
        metricLabel: 'promedio fin de semana',
        icon: Calendar,
        color: weekendAnalysis.percentageDifference > 0 ? 'warning' : 'success'
      });
    }

    // Análisis de gastos hormiga
    const antAnalysis = identifyAntExpenses(transactions);
    if (antAnalysis.count > 10) {
      insights.push({
        type: 'info',
        title: 'Gastos Hormiga Detectados',
        description: `Has realizado ${antAnalysis.count} gastos pequeños en "${antAnalysis.topCategory}". Estos gastos pueden sumar significativamente.`,
        metric: `${antAnalysis.count}`,
        metricLabel: 'gastos pequeños',
        icon: Coffee,
        color: 'purple'
      });
    }

    // Análisis de suscripciones
    const recurringAnalysis = analyzeRecurringExpenses(transactions);
    if (recurringAnalysis.totalRecurring > 0) {
      insights.push({
        type: 'info',
        title: 'Gastos Recurrentes',
        description: `Tienes gastos recurrentes por un total de $${recurringAnalysis.totalRecurring.toLocaleString('es-CL')} en los últimos 6 meses.`,
        metric: `$${recurringAnalysis.totalRecurring.toLocaleString('es-CL')}`,
        metricLabel: 'total recurrente',
        icon: CreditCard,
        color: 'blue'
      });
    }

    // Análisis de ahorro mensual
    const savingsAnalysis = calculateMonthlySavings(transactions);
    if (savingsAnalysis.monthlySavings > 0 && savingsGoals.length > 0) {
      const activeGoal = savingsGoals.find(goal => goal.status === 'active');
      if (activeGoal) {
        const remainingAmount = activeGoal.targetAmount - (activeGoal.currentAmount || 0);
        const monthsToGoal = remainingAmount / savingsAnalysis.monthlySavings;
        
        insights.push({
          type: 'success',
          title: 'Progreso hacia tu Meta',
          description: `Con tu ahorro actual de $${savingsAnalysis.monthlySavings.toLocaleString('es-CL')} mensuales, alcanzarás tu meta "${activeGoal.goalName}" en aproximadamente ${Math.ceil(monthsToGoal)} meses.`,
          metric: `${Math.ceil(monthsToGoal)}`,
          metricLabel: 'meses restantes',
          icon: Target,
          color: 'success'
        });
      }
    }

    return insights;
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [currentUser]);

  useEffect(() => {
    if (analysisData) {
      const newInsights = generateInsights(analysisData);
      setInsights(newInsights);
    }
  }, [analysisData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center galaxy-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Analizando tus datos financieros...</p>
          <p className="text-gray-400 text-sm mt-2">Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen galaxy-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Análisis e Inteligencia Financiera
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Descubre patrones en tus gastos y optimiza tus finanzas con insights inteligentes
          </p>
        </div>

        {/* Insights Grid */}
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type}
                title={insight.title}
                description={insight.description}
                metric={insight.metric}
                metricLabel={insight.metricLabel}
                icon={insight.icon}
                color={insight.color}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card-strong p-8 rounded-xl text-center">
            <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay suficientes datos para análisis
            </h3>
            <p className="text-gray-300">
              Realiza algunas transacciones para obtener insights inteligentes sobre tus finanzas.
            </p>
          </div>
        )}

        {/* Resumen de Datos */}
        {analysisData && (
          <div className="glass-card-strong p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">
              Resumen de Datos Analizados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <DollarSign className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-400">
                  {analysisData.transactions.length}
                </p>
                <p className="text-gray-300 text-sm">Transacciones analizadas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <PiggyBank className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-400">
                  {analysisData.savingsGoals.length}
                </p>
                <p className="text-gray-300 text-sm">Metas de ahorro</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-400">
                  {insights.length}
                </p>
                <p className="text-gray-300 text-sm">Insights generados</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
