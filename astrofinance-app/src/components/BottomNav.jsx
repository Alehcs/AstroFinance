import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  DollarSign, 
  Brain,
  User 
} from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Inicio'
    },
    {
      to: '/transacciones',
      icon: CreditCard,
      label: 'Transacciones'
    },
    {
      to: '/ahorros',
      icon: PiggyBank,
      label: 'Ahorros'
    },
    {
      to: '/prestamos',
      icon: DollarSign,
      label: 'Préstamos'
    },
    {
      to: '/analisis',
      icon: Brain,
      label: 'Análisis'
    },
    {
      to: '/perfil',
      icon: User,
      label: 'Perfil'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 px-2 sm:px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              end={item.to === '/'}
            >
              {({ isActive }) => (
                <>
                  <IconComponent className="nav-icon" />
                  {/* Etiqueta responsiva: visible en sm+ o cuando está activo */}
                  <span className={`nav-label ${isActive ? 'block' : 'hidden sm:block'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
