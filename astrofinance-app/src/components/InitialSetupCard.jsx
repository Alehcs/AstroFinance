import React from 'react';
import { Wallet, Sparkles, ArrowRight, Star } from 'lucide-react';

const InitialSetupCard = ({ onSetupClick }) => {
  return (
    <div className="glass-card-strong p-8 rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-600/10 to-purple-600/10">
      {/* Header con iconos animados */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-6">
          {/* Iconos decorativos */}
          <div className="absolute -top-2 -left-2 text-yellow-400 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute -top-1 -right-3 text-blue-400 animate-bounce">
            <Star className="w-5 h-5" />
          </div>
          <div className="bg-primary-500/20 p-4 rounded-full border-2 border-primary-400/50">
            <Wallet className="w-12 h-12 text-primary-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          ¡Bienvenido a AstroFinance! 🚀
        </h2>
        <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
          Comencemos por configurar tus saldos financieros para tener el control total de tu dinero espacial.
        </p>
      </div>

      {/* Características destacadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-dark-700/50 rounded-xl">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-green-400 font-bold text-sm">$</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Saldo Débito</h3>
          <p className="text-gray-400 text-sm">Dinero disponible</p>
        </div>
        
        <div className="text-center p-4 bg-dark-700/50 rounded-xl">
          <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-purple-400 font-bold text-sm">💳</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Crédito</h3>
          <p className="text-gray-400 text-sm">Cupo disponible</p>
        </div>
        
        <div className="text-center p-4 bg-dark-700/50 rounded-xl">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-blue-400 font-bold text-sm">📊</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Análisis</h3>
          <p className="text-gray-400 text-sm">Insights inteligentes</p>
        </div>
      </div>

      {/* Botón de acción principal */}
      <div className="text-center">
        <button
          onClick={onSetupClick}
          className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center space-x-3 mx-auto group"
        >
          <Wallet className="w-6 h-6" />
          <span>Configurar mis Finanzas</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
        
        <p className="text-gray-400 text-sm mt-4">
          Solo tomará unos segundos configurar tus balances iniciales
        </p>
      </div>

      {/* Información adicional */}
      <div className="mt-8 p-4 bg-dark-800/50 rounded-xl border border-gray-600/30">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-400 text-xs">💡</span>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">¿Por qué necesito configurar esto?</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              Estos balances nos ayudan a calcular correctamente tu patrimonio neto, 
              mostrar tu cupo de crédito disponible y generar análisis financieros precisos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialSetupCard;
