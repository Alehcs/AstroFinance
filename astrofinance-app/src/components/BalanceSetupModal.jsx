import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, CreditCard, Wallet, CheckCircle } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const BalanceSetupModal = ({ isOpen, onClose, currentUser, isInitialSetup = false }) => {
  const [formData, setFormData] = useState({
    debitBalance: '',
    creditLimit: '',
    usedCredit: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Cargar datos existentes cuando se abre el modal
  useEffect(() => {
    if (isOpen && currentUser && !isInitialSetup) {
      loadUserFinancials();
    } else if (isOpen && isInitialSetup) {
      // Resetear formulario para setup inicial
      setFormData({
        debitBalance: '',
        creditLimit: '',
        usedCredit: ''
      });
      setValidationErrors({});
    }
  }, [isOpen, currentUser, isInitialSetup]);

  const loadUserFinancials = async () => {
    try {
      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      const docSnap = await getDoc(userFinancialsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          debitBalance: data.debitBalance?.toString() || '',
          creditLimit: data.creditLimit?.toString() || '',
          usedCredit: data.usedCredit?.toString() || ''
        });
      }
    } catch (error) {
      console.error('Error loading user financials:', error);
      toast.error('Error al cargar los datos financieros');
    }
  };

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

  const validateForm = () => {
    const errors = {};
    
    // Validar saldo débito
    if (!formData.debitBalance) {
      errors.debitBalance = 'El saldo débito es requerido';
    } else if (parseFloat(formData.debitBalance) < 0) {
      errors.debitBalance = 'El saldo no puede ser negativo';
    }
    
    // Validar cupo de crédito
    if (!formData.creditLimit) {
      errors.creditLimit = 'El cupo de crédito es requerido';
    } else if (parseFloat(formData.creditLimit) < 0) {
      errors.creditLimit = 'El cupo no puede ser negativo';
    }
    
    // Validar crédito usado
    if (formData.usedCredit && parseFloat(formData.usedCredit) < 0) {
      errors.usedCredit = 'El crédito usado no puede ser negativo';
    }
    
    // Validar que el crédito usado no exceda el cupo
    if (formData.usedCredit && formData.creditLimit) {
      const used = parseFloat(formData.usedCredit) || 0;
      const limit = parseFloat(formData.creditLimit) || 0;
      if (used > limit) {
        errors.usedCredit = 'El crédito usado no puede exceder el cupo total';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

      const userFinancialsData = {
        debitBalance: parseFloat(formData.debitBalance) || 0,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        usedCredit: parseFloat(formData.usedCredit) || 0,
        lastUpdated: serverTimestamp()
      };

      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      await setDoc(userFinancialsRef, userFinancialsData, { merge: true });

      if (isInitialSetup) {
        toast.success('¡Configuración completada! Bienvenido a AstroFinance 🚀');
      } else {
        toast.success('Balances actualizados exitosamente');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving financial settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      debitBalance: '',
      creditLimit: '',
      usedCredit: ''
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

  const calculateAvailableCredit = () => {
    const creditLimit = parseFloat(formData.creditLimit) || 0;
    const usedCredit = parseFloat(formData.usedCredit) || 0;
    return Math.max(0, creditLimit - usedCredit);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500/20 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isInitialSetup ? 'Configurar Finanzas' : 'Editar Balances'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isInitialSetup ? 'Establece tus balances iniciales' : 'Actualiza tus balances'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Saldo Débito/Efectivo */}
          <div>
            <label htmlFor="debitBalance" className="block text-sm font-medium text-gray-300 mb-2">
              Mi Saldo Actual (Débito/Efectivo) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="debitBalance"
                name="debitBalance"
                value={formData.debitBalance}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.debitBalance
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.debitBalance && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.debitBalance}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Dinero disponible en efectivo o cuentas de débito
            </p>
          </div>

          {/* Cupo Total de Crédito */}
          <div>
            <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-300 mb-2">
              Cupo Total de mi Tarjeta de Crédito *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="creditLimit"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.creditLimit
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.creditLimit && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.creditLimit}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Límite total de tu tarjeta de crédito
            </p>
          </div>

          {/* Monto Utilizado de Crédito */}
          <div>
            <label htmlFor="usedCredit" className="block text-sm font-medium text-gray-300 mb-2">
              Monto ya Utilizado de mi Crédito (Opcional)
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="usedCredit"
                name="usedCredit"
                value={formData.usedCredit}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-3 bg-dark-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.usedCredit
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-dark-600'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.usedCredit && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.usedCredit}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Cantidad del cupo que ya has utilizado
            </p>
          </div>

          {/* Resumen de cupo disponible */}
          {formData.creditLimit && (
            <div className="bg-dark-700/50 rounded-xl p-4 border border-gray-600/30">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">Cupo Disponible</h3>
              </div>
              <p className="text-2xl font-bold text-green-400">
                ${calculateAvailableCredit().toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Dinero disponible en tu tarjeta de crédito
              </p>
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
              disabled={loading || Object.keys(validationErrors).length > 0 || !formData.debitBalance || !formData.creditLimit}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isInitialSetup ? 'Configurar' : 'Actualizar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BalanceSetupModal;
