import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header principal */}
      <Header />
      
      {/* Área de contenido principal */}
      <main className="flex-1 pb-20 px-4 py-6 overflow-y-auto">
        <Outlet />
      </main>
      
      {/* Barra de navegación inferior fija */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
