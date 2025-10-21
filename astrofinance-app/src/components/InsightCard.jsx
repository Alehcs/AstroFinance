import { TrendingUp, TrendingDown, Target, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';

const InsightCard = ({ 
  type = 'info', 
  title, 
  description, 
  metric, 
  metricLabel, 
  icon: Icon, 
  color = 'blue',
  actionText,
  onAction
}) => {
  // Configuración de colores por tipo
  const colorConfig = {
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      icon: 'text-blue-400'
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-400',
      icon: 'text-green-400'
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400',
      icon: 'text-yellow-400'
    },
    danger: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      icon: 'text-red-400'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      icon: 'text-purple-400'
    }
  };

  // Íconos por tipo
  const getIcon = () => {
    if (Icon) return Icon;
    
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'danger':
        return AlertTriangle;
      default:
        return Lightbulb;
    }
  };

  const IconComponent = getIcon();
  const config = colorConfig[color] || colorConfig.info;

  return (
    <div className={`glass-card-strong p-6 rounded-xl border ${config.border} ${config.bg} hover:scale-105 transition-all duration-300`}>
      <div className="flex items-start space-x-4">
        {/* Ícono */}
        <div className={`flex-shrink-0 p-3 rounded-lg ${config.bg} ${config.border} border`}>
          <IconComponent className={`w-6 h-6 ${config.icon}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Título */}
          <h3 className={`text-lg font-semibold ${config.text} mb-2`}>
            {title}
          </h3>

          {/* Descripción */}
          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            {description}
          </p>

          {/* Métrica */}
          {metric && (
            <div className="flex items-center space-x-2 mb-4">
              <span className={`text-2xl font-bold ${config.text}`}>
                {metric}
              </span>
              {metricLabel && (
                <span className="text-gray-400 text-sm">
                  {metricLabel}
                </span>
              )}
            </div>
          )}

          {/* Acción */}
          {actionText && onAction && (
            <button
              onClick={onAction}
              className={`px-4 py-2 rounded-lg ${config.bg} ${config.border} border ${config.text} hover:scale-105 transition-all duration-200 text-sm font-medium`}
            >
              {actionText}
            </button>
          )}
        </div>

        {/* Indicador de tendencia */}
        {type === 'success' && (
          <div className="flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
        )}
        {type === 'warning' && (
          <div className="flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-yellow-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightCard;
