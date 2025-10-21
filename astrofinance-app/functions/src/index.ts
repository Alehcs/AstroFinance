import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function para manejar transacciones recurrentes
 * Se ejecuta diariamente a las 6:00 AM UTC
 */
export const handleRecurringTransactions = functions.pubsub
  .schedule('0 6 * * *') // Ejecutar diariamente a las 6:00 AM UTC
  .timeZone('America/Santiago') // Zona horaria de Chile
  .onRun(async (context) => {
    console.log('🔄 Iniciando procesamiento de transacciones recurrentes...');
    
    try {
      const today = new Date();
      const dayOfMonth = today.getDate();
      
      console.log(`📅 Procesando transacciones para el día ${dayOfMonth} del mes`);
      
      // Buscar todas las transacciones recurrentes para el día actual
      const recurringTransactionsSnapshot = await db
        .collection('recurringTransactions')
        .where('dayOfMonth', '==', dayOfMonth)
        .get();
      
      if (recurringTransactionsSnapshot.empty) {
        console.log('✅ No hay transacciones recurrentes para procesar hoy');
        return;
      }
      
      const batch = db.batch();
      let processedCount = 0;
      
      for (const doc of recurringTransactionsSnapshot.docs) {
        const recurringTransaction = doc.data();
        
        try {
          // Verificar si ya se procesó esta transacción este mes
          const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
          const transactionId = `recurring_${doc.id}_${currentMonth}`;
          
          // Crear nueva transacción
          const transactionRef = db.collection('transactions').doc(transactionId);
          const transactionData = {
            userId: recurringTransaction.userId,
            accountId: recurringTransaction.accountId,
            type: recurringTransaction.type,
            amount: recurringTransaction.amount,
            description: recurringTransaction.description,
            category: recurringTransaction.category,
            date: admin.firestore.Timestamp.fromDate(today),
            isRecurring: true,
            recurringTransactionId: doc.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          batch.set(transactionRef, transactionData);
          
          // Actualizar saldo de la cuenta
          const accountRef = db.collection('accounts').doc(recurringTransaction.accountId);
          const accountDoc = await accountRef.get();
          
          if (accountDoc.exists) {
            const accountData = accountDoc.data();
            let newBalance;
            
            if (accountData?.accountType === 'Tarjeta de Crédito') {
              // Para tarjetas de crédito: gastos aumentan usedCredit
              const currentUsedCredit = accountData.usedCredit || 0;
              newBalance = recurringTransaction.type === 'expense' 
                ? currentUsedCredit + recurringTransaction.amount
                : Math.max(0, currentUsedCredit - recurringTransaction.amount);
              
              batch.update(accountRef, {
                usedCredit: newBalance,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            } else {
              // Para cuentas normales
              const currentBalance = accountData?.currentBalance || 0;
              newBalance = recurringTransaction.type === 'income'
                ? currentBalance + recurringTransaction.amount
                : currentBalance - recurringTransaction.amount;
              
              batch.update(accountRef, {
                currentBalance: newBalance,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
          
          processedCount++;
          console.log(`✅ Procesada transacción recurrente: ${recurringTransaction.description}`);
          
        } catch (error) {
          console.error(`❌ Error procesando transacción recurrente ${doc.id}:`, error);
        }
      }
      
      await batch.commit();
      console.log(`🎉 Procesadas ${processedCount} transacciones recurrentes exitosamente`);
      
    } catch (error) {
      console.error('❌ Error en handleRecurringTransactions:', error);
      throw error;
    }
  });

/**
 * Cloud Function para recordatorios de pagos de préstamos
 * Se ejecuta diariamente a las 9:00 AM UTC
 */
export const checkLoanPaymentReminders = functions.pubsub
  .schedule('0 9 * * *') // Ejecutar diariamente a las 9:00 AM UTC
  .timeZone('America/Santiago')
  .onRun(async (context) => {
    console.log('🔔 Iniciando verificación de recordatorios de préstamos...');
    
    try {
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      // Buscar préstamos con próximo pago en 3 días
      const loansSnapshot = await db
        .collection('loans')
        .where('status', '==', 'active')
        .get();
      
      if (loansSnapshot.empty) {
        console.log('✅ No hay préstamos activos para verificar');
        return;
      }
      
      let reminderCount = 0;
      
      for (const doc of loansSnapshot.docs) {
        const loan = doc.data();
        
        if (!loan.nextPaymentDate) {
          continue;
        }
        
        const nextPaymentDate = loan.nextPaymentDate.toDate();
        
        // Verificar si el próximo pago es en exactamente 3 días
        const isThreeDaysFromNow = 
          nextPaymentDate.getDate() === threeDaysFromNow.getDate() &&
          nextPaymentDate.getMonth() === threeDaysFromNow.getMonth() &&
          nextPaymentDate.getFullYear() === threeDaysFromNow.getFullYear();
        
        if (isThreeDaysFromNow) {
          // Verificar si ya se envió un recordatorio para este préstamo
          const existingNotification = await db
            .collection('notifications')
            .where('userId', '==', loan.userId)
            .where('type', '==', 'loan_reminder')
            .where('loanId', '==', doc.id)
            .where('isRead', '==', false)
            .get();
          
          if (!existingNotification.empty) {
            continue; // Ya existe un recordatorio no leído
          }
          
          // Crear notificación de recordatorio
          const notificationData = {
            userId: loan.userId,
            type: 'loan_reminder',
            title: 'Recordatorio de Pago',
            message: `Tu préstamo "${loan.loanName}" vence en 3 días. Monto: $${loan.monthlyPayment?.toLocaleString() || 'N/A'}`,
            loanId: doc.id,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await db.collection('notifications').add(notificationData);
          reminderCount++;
          
          console.log(`🔔 Recordatorio creado para préstamo: ${loan.loanName}`);
        }
      }
      
      console.log(`🎉 Se crearon ${reminderCount} recordatorios de préstamos`);
      
    } catch (error) {
      console.error('❌ Error en checkLoanPaymentReminders:', error);
      throw error;
    }
  });

/**
 * Cloud Function para alertas de presupuesto
 * Se activa cuando se crea una nueva transacción de gasto
 */
export const checkBudgetAlerts = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    console.log('💰 Verificando alertas de presupuesto...');
    
    try {
      const transaction = snap.data();
      
      // Solo procesar transacciones de gasto
      if (transaction.type !== 'expense') {
        return;
      }
      
      const userId = transaction.userId;
      const category = transaction.category;
      const amount = transaction.amount;
      const transactionDate = transaction.date.toDate();
      const currentMonth = transactionDate.toISOString().slice(0, 7); // YYYY-MM
      
      console.log(`📊 Verificando presupuesto para usuario ${userId}, categoría ${category}, mes ${currentMonth}`);
      
      // Buscar el presupuesto del mes actual para esta categoría
      const budgetSnapshot = await db
        .collection('budgets')
        .where('userId', '==', userId)
        .where('month', '==', currentMonth)
        .limit(1)
        .get();
      
      if (budgetSnapshot.empty) {
        console.log('ℹ️ No hay presupuesto definido para este mes');
        return;
      }
      
      const budget = budgetSnapshot.docs[0].data();
      const categoryLimit = budget.limits?.[category];
      
      if (!categoryLimit) {
        console.log(`ℹ️ No hay límite definido para la categoría ${category}`);
        return;
      }
      
      // Calcular el total gastado en esta categoría durante el mes actual
      const startOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1);
      const endOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0, 23, 59, 59);
      
      const expensesSnapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('type', '==', 'expense')
        .where('category', '==', category)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfMonth))
        .get();
      
      let totalSpent = 0;
      expensesSnapshot.forEach(doc => {
        totalSpent += doc.data().amount;
      });
      
      const percentageSpent = (totalSpent / categoryLimit) * 100;
      
      console.log(`📈 Categoría ${category}: $${totalSpent.toLocaleString()} de $${categoryLimit.toLocaleString()} (${percentageSpent.toFixed(1)}%)`);
      
      // Verificar umbrales de alerta
      const alertThresholds = [90, 100, 110]; // 90%, 100%, 110%
      
      for (const threshold of alertThresholds) {
        if (percentageSpent >= threshold && percentageSpent < threshold + 10) {
          // Verificar si ya se envió una alerta para este umbral
          const existingAlert = await db
            .collection('notifications')
            .where('userId', '==', userId)
            .where('type', '==', 'budget_alert')
            .where('category', '==', category)
            .where('month', '==', currentMonth)
            .where('threshold', '==', threshold)
            .where('isRead', '==', false)
            .get();
          
          if (!existingAlert.empty) {
            continue; // Ya existe una alerta para este umbral
          }
          
          let alertMessage = '';
          let alertTitle = '';
          
          if (threshold === 90) {
            alertTitle = '⚠️ Presupuesto al 90%';
            alertMessage = `Has alcanzado el 90% de tu presupuesto en '${category}'. Has gastado $${totalSpent.toLocaleString()} de $${categoryLimit.toLocaleString()}.`;
          } else if (threshold === 100) {
            alertTitle = '🚨 Presupuesto agotado';
            alertMessage = `¡Has agotado tu presupuesto en '${category}'! Has gastado $${totalSpent.toLocaleString()} de $${categoryLimit.toLocaleString()}.`;
          } else if (threshold === 110) {
            alertTitle = '💸 Presupuesto excedido';
            alertMessage = `¡Has excedido tu presupuesto en '${category}'! Has gastado $${totalSpent.toLocaleString()} de $${categoryLimit.toLocaleString()}.`;
          }
          
          // Crear notificación de alerta
          const alertData = {
            userId: userId,
            type: 'budget_alert',
            title: alertTitle,
            message: alertMessage,
            category: category,
            month: currentMonth,
            threshold: threshold,
            amountSpent: totalSpent,
            budgetLimit: categoryLimit,
            percentageSpent: percentageSpent,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await db.collection('notifications').add(alertData);
          console.log(`🔔 Alerta creada: ${alertTitle} para ${category}`);
          break; // Solo crear una alerta por transacción
        }
      }
      
    } catch (error) {
      console.error('❌ Error en checkBudgetAlerts:', error);
      throw error;
    }
  });

/**
 * Cloud Function para limpiar notificaciones antiguas
 * Se ejecuta semanalmente para mantener la base de datos limpia
 */
export const cleanupOldNotifications = functions.pubsub
  .schedule('0 2 * * 0') // Ejecutar domingos a las 2:00 AM UTC
  .timeZone('America/Santiago')
  .onRun(async (context) => {
    console.log('🧹 Iniciando limpieza de notificaciones antiguas...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldNotificationsSnapshot = await db
        .collection('notifications')
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();
      
      if (oldNotificationsSnapshot.empty) {
        console.log('✅ No hay notificaciones antiguas para limpiar');
        return;
      }
      
      const batch = db.batch();
      oldNotificationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`🗑️ Eliminadas ${oldNotificationsSnapshot.size} notificaciones antiguas`);
      
    } catch (error) {
      console.error('❌ Error en cleanupOldNotifications:', error);
      throw error;
    }
  });

/**
 * Cloud Function para resetear todos los datos de un usuario
 * Función invocable que permite al usuario eliminar todos sus datos financieros
 */
export const resetUserData = functions.https.onCall(async (data, context) => {
  console.log('🔄 Iniciando reset de datos de usuario...');
  
  try {
    // Verificar autenticación
    if (!context.auth) {
      console.error('❌ Usuario no autenticado');
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    const userId = context.auth.uid;
    console.log(`👤 Reseteando datos para usuario: ${userId}`);
    
    // Lista de colecciones a limpiar
    const collectionsToClean = [
      'transactions',
      'savingGoals',
      'loans',
      'budgets',
      'recurringTransactions',
      'notifications'
    ];
    
    let totalDeleted = 0;
    
    // Limpiar cada colección usando batched writes
    for (const collectionName of collectionsToClean) {
      console.log(`🗑️ Limpiando colección: ${collectionName}`);
      
      // Buscar todos los documentos del usuario en esta colección
      const snapshot = await db
        .collection(collectionName)
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) {
        console.log(`✅ No hay documentos en ${collectionName}`);
        continue;
      }
      
      // Usar batched writes para eliminar documentos en lotes
      const batchSize = 500; // Límite de Firestore
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        totalDeleted += batchDocs.length;
        console.log(`✅ Eliminados ${batchDocs.length} documentos de ${collectionName}`);
      }
    }
    
    // Eliminar el documento principal de userFinancials
    console.log('💰 Eliminando datos financieros principales...');
    const userFinancialsRef = db.collection('userFinancials').doc(userId);
    await userFinancialsRef.delete();
    console.log('✅ Datos financieros principales eliminados');
    
    // Eliminar el perfil del usuario
    console.log('👤 Eliminando perfil del usuario...');
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.delete();
    console.log('✅ Perfil eliminado');
    
    console.log(`🎉 Reset completado. Total de documentos eliminados: ${totalDeleted}`);
    
    return {
      success: true,
      message: 'Todos los datos han sido eliminados exitosamente',
      deletedDocuments: totalDeleted,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
  } catch (error) {
    console.error('❌ Error durante el reset de datos:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Error interno del servidor', error.message);
  }
});
