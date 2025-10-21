import { Rocket, Sparkles } from 'lucide-react';

const Logo = ({ 
  size = 'md', 
  color = 'gradient', 
  showText = true, 
  className = '',
  animated = false 
}) => {
  // Configuración de tamaños
  const sizeConfig = {
    xs: { icon: 'w-4 h-4', text: 'text-sm', spacing: 'space-x-1' },
    sm: { icon: 'w-6 h-6', text: 'text-lg', spacing: 'space-x-2' },
    md: { icon: 'w-8 h-8', text: 'text-xl', spacing: 'space-x-3' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', spacing: 'space-x-4' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', spacing: 'space-x-5' }
  };

  // Configuración de colores
  const colorConfig = {
    white: {
      icon: 'text-white',
      text: 'text-white'
    },
    gradient: {
      icon: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500',
      text: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
    },
    primary: {
      icon: 'text-primary-500',
      text: 'text-primary-500'
    },
    blue: {
      icon: 'text-blue-500',
      text: 'text-blue-500'
    },
    purple: {
      icon: 'text-purple-500',
      text: 'text-purple-500'
    }
  };

  const config = sizeConfig[size];
  const colors = colorConfig[color];

  return (
    <div className={`flex items-center ${config.spacing} ${className}`}>
      {/* Icono principal con efecto de cohete */}
      <div className="relative">
        <Rocket 
          className={`${config.icon} ${colors.icon} ${animated ? 'animate-pulse' : ''}`}
        />
        
        {/* Efecto de estrellas alrededor del cohete */}
        <div className="absolute -top-1 -right-1">
          <Sparkles 
            className={`w-3 h-3 ${colors.icon} ${animated ? 'animate-ping' : ''}`}
            style={{ animationDelay: '0.5s' }}
          />
        </div>
        <div className="absolute -bottom-1 -left-1">
          <Sparkles 
            className={`w-2 h-2 ${colors.icon} ${animated ? 'animate-ping' : ''}`}
            style={{ animationDelay: '1s' }}
          />
        </div>
      </div>

      {/* Texto del logo */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${config.text} ${colors.text} leading-tight`}>
            AstroFinance
          </span>
          <span className={`text-xs ${colors.text} opacity-70 font-light tracking-wider`}>
            SPACE BANKING
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
