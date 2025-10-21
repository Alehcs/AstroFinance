import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Tag, FileText, CreditCard, Wallet } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const TransactionModal = ({ isOpen, onClose, transactionToEdit, currentUser }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    category: '',
    paymentMethod: '',
    bankName: ''
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Categorías disponibles
  const categories = {
    expense: [
      'Comida',
      'Transporte',
      'Vivienda',
      'Salud',
      'Entretenimiento',
      'Ropa',
      'Regalos',
      'Ocio',
      'Ahorros',
      'Otros'
    ],
    income: [
      'Salario',
      'Freelance',
      'Inversiones',
      'Reembolsos',
      'Bonus',
      'Trabajo freelance',
      'Ahorros',
      'Otros'
    ]
  };

  // Métodos de pago disponibles
  const paymentMethods = [
    'Débito',
    'Crédito',
    'Efectivo'
  ];

  // Bancos chilenos disponibles
  const banks = [
    'Banco de Chile',
    'Banco Santander',
    'Banco Estado',
    'Banco BCI',
    'Banco Security',
    'Banco Falabella',
    'Banco Ripley',
    'Banco Consorcio',
    'Banco Itaú',
    'Banco Scotiabank',
    'Banco Edwards',
    'Banco BBVA',
    'Otro'
  ];

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setFormData({
          description: transactionToEdit.description || '',
          amount: transactionToEdit.amount?.toString() || '',
          date: transactionToEdit.date ? format(transactionToEdit.date.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          type: transactionToEdit.type || 'expense',
          category: transactionToEdit.category || '',
          paymentMethod: transactionToEdit.paymentMethod || '',
          bankName: transactionToEdit.bankName || ''
        });
      } else {
        setFormData({
          description: '',
          amount: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'expense',
          category: '',
          paymentMethod: '',
          bankName: ''
        });
      }
      setValidationErrors({});
    }
  }, [isOpen, transactionToEdit]);

  // Función para validar el formulario
  const validateForm = () => {
    const errors = {};
    
    // Validar descripción
    if (!formData.description.trim()) {
      errors.description = 'La descripción es requerida';
    } else if (formData.description.trim().length < 3) {
      errors.description = 'La descripción debe tener al menos 3 caracteres';
    }
    
    // Validar monto
    if (!formData.amount) {
      errors.amount = 'El monto es requerido';
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a 0';
    } else if (parseFloat(formData.amount) > 100000000) {
      errors.amount = 'El monto es demasiado alto';
    }
    
    // Validar categoría
    if (!formData.category) {
      errors.category = 'Selecciona una categoría';
    }
    
    // Validar método de pago
    if (!formData.paymentMethod) {
      errors.paymentMethod = 'Selecciona un método de pago';
    }
    
    // Validar fecha
    if (!formData.date) {
      errors.date = 'La fecha es requerida';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (selectedDate > today) {
        errors.date = 'La fecha no puede ser futura';
      } else if (selectedDate < oneYearAgo) {
        errors.date = 'La fecha no puede ser anterior a un año';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico cuando el usuario empiece a escribir
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Validar formulario
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);

      const transactionData = {
        userId: currentUser.uid,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        bankName: formData.bankName || '',
        date: new Date(formData.date),
        createdAt: serverTimestamp()
      };

      const batch = writeBatch(db);

      if (transactionToEdit) {
        // Actualizar transacción existente
        const transactionRef = doc(db, 'transactions', transactionToEdit.id);
        batch.update(transactionRef, {
          ...transactionData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Crear nueva transacción
        const transactionRef = doc(collection(db, 'transactions'));
        batch.set(transactionRef, transactionData);
      }

      // Actualizar balances en userFinancials
      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      const userFinancialsSnap = await getDoc(userFinancialsRef);
      
      let debitBalance = 0;
      let usedCredit = 0;
      
      if (userFinancialsSnap.exists()) {
        const data = userFinancialsSnap.data();
        debitBalance = data.debitBalance || 0;
        usedCredit = data.usedCredit || 0;
      }

      // Calcular el cambio en los balances
      const amount = parseFloat(formData.amount);
      let debitChange = 0;
      let creditChange = 0;

      if (formData.type === 'income') {
        // Los ingresos siempre van al saldo débito
        debitChange = amount;
      } else {
        // Los gastos van al método de pago seleccionado
        if (formData.paymentMethod === 'Crédito') {
          creditChange = amount;
        } else {
          // Débito o Efectivo van al saldo débito (se resta)
          debitChange = -amount;
        }
      }

      // Si estamos editando, necesitamos revertir el efecto de la transacción anterior
      if (transactionToEdit) {
        const oldAmount = parseFloat(transactionToEdit.amount);
        if (transactionToEdit.type === 'income') {
          debitChange -= oldAmount; // Revertir ingreso anterior
        } else {
          if (transactionToEdit.paymentMethod === 'Crédito') {
            creditChange -= oldAmount; // Revertir gasto de crédito anterior
          } else {
            debitChange += oldAmount; // Revertir gasto de débito anterior
          }
        }
      }

      // Actualizar los balances
      batch.set(userFinancialsRef, {
        debitBalance: Math.max(0, debitBalance + debitChange),
        usedCredit: Math.max(0, usedCredit + creditChange),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      await batch.commit();

      toast.success(transactionToEdit ? 'Transacción actualizada exitosamente' : 'Transacción creada exitosamente');
      handleClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Error al guardar la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
      category: '',
      paymentMethod: '',
      bankName: ''
    });
    setValidationErrors({});
    onClose();
  };

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold text-white">
            {transactionToEdit ? 'Editar Transacción' : 'Nueva Transacción'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-28">
          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ej: Cena en restaurante"
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.description
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.description && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Monto */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
              Monto
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.amount
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.amount && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.amount}</p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
              Fecha
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.date 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.date && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.date}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>

          {/* Método de Pago */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-300 mb-2">
              Método de Pago *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.paymentMethod 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              >
                <option value="">Selecciona un método de pago</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            {validationErrors.paymentMethod && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.paymentMethod}</p>
            )}
          </div>

          {/* Banco (Opcional) */}
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-300 mb-2">
              Banco (Opcional)
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Selecciona un banco (opcional)</option>
                {banks.map(bank => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
              Categoría
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.category 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              >
                <option value="">Selecciona una categoría</option>
                {categories[formData.type].map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {validationErrors.category && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.category}</p>
            )}
          </div>

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
              disabled={loading || Object.keys(validationErrors).length > 0 || !formData.description.trim() || !formData.amount || !formData.category || !formData.paymentMethod}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {transactionToEdit ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;