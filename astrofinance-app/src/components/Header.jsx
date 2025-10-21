import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import Logo from './Logo';
import UserAvatar from './UserAvatar';

const Header = () => {
  const { currentUser, logout } = useAuth();

  // Función para obtener el nombre del usuario
  const getUserName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Usuario';
  };

  // Función para manejar logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="glass-card-strong border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo con navegación al home */}
          <Link 
            to="/app" 
            className="flex items-center hover:opacity-80 transition-opacity duration-200"
          >
            <Logo size="md" color="gradient" animated={true} />
          </Link>

          {/* Información del usuario y acciones */}
          <div className="flex items-center space-x-4">
            {/* Saludo al usuario */}
            <div className="hidden sm:block">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    ¡Hola, <span className="text-white font-medium">{getUserName()}!</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Bienvenido al espacio financiero
                  </p>
                </div>
                
                {/* Avatar del usuario */}
                <div className="relative">
                  <UserAvatar 
                    seed={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'AstroUser'}
                    size={32}
                    showBorder={false}
                  />
                  
                  {/* Indicador de estado online */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
              </div>
            </div>


            {/* Botón de logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-200 group"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
              <span className="hidden sm:block text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Efecto de brillo sutil en la parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </header>
  );
};

export default Header;
