import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const SummaryCard = ({ 
  title, 
  amount, 
  type = 'default', // 'income', 'expense', 'balance', 'default'
  icon = 'default',
  subtitle = '',
  trend = null, // { value: '+5.2%', isPositive: true }
  onClick = null 
}) => {
  // Configuración de colores según el tipo
  const getCardStyles = () => {
    switch (type) {
      case 'income':
        return {
          bgGradient: 'from-green-500 to-green-600',
          bgCard: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          textColor: 'text-green-400',
          iconColor: 'text-green-400'
        };
      case 'expense':
        return {
          bgGradient: 'from-red-500 to-red-600',
          bgCard: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          textColor: 'text-red-400',
          iconColor: 'text-red-400'
        };
      case 'balance':
        return {
          bgGradient: 'from-blue-500 to-blue-600',
          bgCard: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          textColor: 'text-blue-400',
          iconColor: 'text-blue-400'
        };
      default:
        return {
          bgGradient: 'from-gray-500 to-gray-600',
          bgCard: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          textColor: 'text-gray-400',
          iconColor: 'text-gray-400'
        };
    }
  };

  // Configuración del ícono
  const getIcon = () => {
    switch (icon) {
      case 'trending-up':
        return <TrendingUp className="w-6 h-6" />;
      case 'trending-down':
        return <TrendingDown className="w-6 h-6" />;
      case 'dollar':
        return <DollarSign className="w-6 h-6" />;
      case 'calendar':
        return <Calendar className="w-6 h-6" />;
      default:
        return <DollarSign className="w-6 h-6" />;
    }
  };

  // Formatear el monto (ya importado desde utils/currency)

  const styles = getCardStyles();
  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6 transition-all duration-200
        ${styles.bgCard} ${styles.borderColor} border
        ${onClick ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : ''}
        ${styles.textColor}
      `}
    >
      {/* Fondo con gradiente sutil */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.bgGradient} opacity-5`}></div>
      
      {/* Contenido */}
      <div className="relative z-10">
        {/* Header con ícono y título */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${styles.bgCard} ${styles.iconColor}`}>
            {getIcon()}
          </div>
          
          {trend && (
            <div className={`text-sm font-medium px-2 py-1 rounded-full ${
              trend.isPositive 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {trend.value}
            </div>
          )}
        </div>

        {/* Título */}
        <h3 className="text-sm font-medium text-gray-400 mb-2">
          {title}
        </h3>

        {/* Monto principal */}
        <div className="mb-2">
          <span className={`text-3xl font-bold ${styles.textColor}`}>
            {formatCurrency(amount)}
          </span>
        </div>

        {/* Subtítulo */}
        {subtitle && (
          <p className="text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      {/* Efecto de brillo sutil */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10"></div>
    </CardComponent>
  );
};

export default SummaryCard;
