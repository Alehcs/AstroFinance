import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, DollarSign, CreditCard, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const FinancialSettingsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    debitBalance: '',
    creditLimit: '',
    usedCredit: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadUserFinancials();
    }
  }, [currentUser]);

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
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      setLoading(true);

      const userFinancialsData = {
        debitBalance: parseFloat(formData.debitBalance) || 0,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        usedCredit: parseFloat(formData.usedCredit) || 0,
        lastUpdated: new Date()
      };

      const userFinancialsRef = doc(db, 'userFinancials', currentUser.uid);
      await setDoc(userFinancialsRef, userFinancialsData);

      toast.success('Configuración financiera guardada exitosamente');
    } catch (error) {
      console.error('Error saving financial settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableCredit = () => {
    const creditLimit = parseFloat(formData.creditLimit) || 0;
    const usedCredit = parseFloat(formData.usedCredit) || 0;
    return Math.max(0, creditLimit - usedCredit);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="bg-primary-500/20 p-3 rounded-full">
          <Wallet className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración Financiera</h1>
          <p className="text-gray-400 text-sm">Configura tus balances principales</p>
        </div>
      </div>

      {/* Resumen de Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card-strong p-6 rounded-xl border border-green-500/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-500/20 p-2 rounded-full">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Saldo Débito/Efectivo</h3>
              <p className="text-gray-400 text-sm">Dinero disponible</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-400">
            ${formData.debitBalance ? parseFloat(formData.debitBalance).toLocaleString() : '0'}
          </p>
        </div>

        <div className="glass-card-strong p-6 rounded-xl border border-blue-500/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Cupo Disponible</h3>
              <p className="text-gray-400 text-sm">Crédito disponible</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            ${calculateAvailableCredit().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Formulario de Configuración */}
      <div className="glass-card-strong p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-6">Configurar Balances</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Saldo Débito/Efectivo */}
          <div>
            <label htmlFor="debitBalance" className="block text-sm font-medium text-gray-300 mb-2">
              Mi Saldo Actual (Débito/Efectivo)
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
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Dinero disponible en efectivo o cuentas de débito
            </p>
          </div>

          {/* Cupo Total de Crédito */}
          <div>
            <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-300 mb-2">
              Cupo Total de mi Tarjeta de Crédito
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
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Límite total de tu tarjeta de crédito
            </p>
          </div>

          {/* Monto Utilizado de Crédito */}
          <div>
            <label htmlFor="usedCredit" className="block text-sm font-medium text-gray-300 mb-2">
              Monto Ya Utilizado de mi Crédito
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
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Cantidad del cupo que ya has utilizado
            </p>
          </div>

          {/* Botón de Guardar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Información Adicional */}
      <div className="glass-card p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-3">💡 Información Importante</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• <strong>Saldo Débito/Efectivo:</strong> Dinero disponible en efectivo o cuentas de débito</li>
          <li>• <strong>Cupo de Crédito:</strong> Límite total de tu tarjeta de crédito</li>
          <li>• <strong>Crédito Utilizado:</strong> Cantidad del cupo que ya has gastado</li>
          <li>• <strong>Cupo Disponible:</strong> Se calcula automáticamente (Cupo Total - Crédito Utilizado)</li>
        </ul>
      </div>
    </div>
  );
};

export default FinancialSettingsPage;
