import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Función para agregar transacciones de muestra
export const addSampleTransactions = async (userId) => {
  const sampleTransactions = [
    // Ingresos (en CLP)
    {
      userId,
      type: 'income',
      amount: 850000, // ~850,000 CLP
      description: 'Salario mensual',
      category: 'Salario',
      date: new Date(2024, 10, 1) // 1 de noviembre
    },
    {
      userId,
      type: 'income',
      amount: 150000, // ~150,000 CLP
      description: 'Freelance diseño web',
      category: 'Trabajo freelance',
      date: new Date(2024, 10, 5)
    },
    {
      userId,
      type: 'income',
      amount: 75000, // ~75,000 CLP
      description: 'Reembolso de compra',
      category: 'Reembolsos',
      date: new Date(2024, 10, 8)
    },
    
    // Gastos (en CLP)
    {
      userId,
      type: 'expense',
      amount: 450000, // ~450,000 CLP
      description: 'Arriendo del departamento',
      category: 'Vivienda',
      date: new Date(2024, 10, 1)
    },
    {
      userId,
      type: 'expense',
      amount: 120000, // ~120,000 CLP
      description: 'Compras del supermercado',
      category: 'Comida',
      date: new Date(2024, 10, 3)
    },
    {
      userId,
      type: 'expense',
      amount: 35000, // ~35,000 CLP
      description: 'Bencina del mes',
      category: 'Transporte',
      date: new Date(2024, 10, 4)
    },
    {
      userId,
      type: 'expense',
      amount: 25000, // ~25,000 CLP
      description: 'Netflix y Spotify',
      category: 'Entretenimiento',
      date: new Date(2024, 10, 6)
    },
    {
      userId,
      type: 'expense',
      amount: 45000, // ~45,000 CLP
      description: 'Cena en restaurante',
      category: 'Comida',
      date: new Date(2024, 10, 7)
    },
    {
      userId,
      type: 'expense',
      amount: 80000, // ~80,000 CLP
      description: 'Ropa de invierno',
      category: 'Ropa',
      date: new Date(2024, 10, 9)
    },
    {
      userId,
      type: 'expense',
      amount: 30000, // ~30,000 CLP
      description: 'Gimnasio mensual',
      category: 'Salud',
      date: new Date(2024, 10, 10)
    }
  ];

  try {
    const transactionsRef = collection(db, 'transactions');
    const promises = sampleTransactions.map(transaction => 
      addDoc(transactionsRef, {
        ...transaction,
        createdAt: serverTimestamp()
      })
    );

    await Promise.all(promises);
    console.log('Transacciones de muestra agregadas exitosamente');
    return { success: true, message: 'Transacciones de muestra agregadas' };
  } catch (error) {
    console.error('Error agregando transacciones de muestra:', error);
    return { success: false, message: 'Error al agregar transacciones de muestra' };
  }
};

// Función para agregar transacciones del mes actual
export const addCurrentMonthTransactions = async (userId) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTransactions = [
    {
      userId,
      type: 'income',
      amount: 850000, // ~850,000 CLP
      description: 'Salario de diciembre',
      category: 'Salario',
      date: new Date(currentYear, currentMonth, 1)
    },
    {
      userId,
      type: 'expense',
      amount: 450000, // ~450,000 CLP
      description: 'Arriendo diciembre',
      category: 'Vivienda',
      date: new Date(currentYear, currentMonth, 1)
    },
    {
      userId,
      type: 'expense',
      amount: 120000, // ~120,000 CLP
      description: 'Compras navideñas',
      category: 'Regalos',
      date: new Date(currentYear, currentMonth, 5)
    },
    {
      userId,
      type: 'income',
      amount: 200000, // ~200,000 CLP
      description: 'Bono navideño',
      category: 'Bonus',
      date: new Date(currentYear, currentMonth, 15)
    },
    {
      userId,
      type: 'expense',
      amount: 60000, // ~60,000 CLP
      description: 'Cena de fin de año',
      category: 'Comida',
      date: new Date(currentYear, currentMonth, 20)
    }
  ];

  try {
    const transactionsRef = collection(db, 'transactions');
    const promises = currentMonthTransactions.map(transaction => 
      addDoc(transactionsRef, {
        ...transaction,
        createdAt: serverTimestamp()
      })
    );

    await Promise.all(promises);
    console.log('Transacciones del mes actual agregadas');
    return { success: true, message: 'Transacciones del mes actual agregadas' };
  } catch (error) {
    console.error('Error agregando transacciones del mes actual:', error);
    return { success: false, message: 'Error al agregar transacciones del mes actual' };
  }
};
