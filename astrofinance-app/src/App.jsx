import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setupErrorHandling } from './utils/errorHandler';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import SavingsPage from './pages/SavingsPage';
import LoansPage from './pages/LoansPage';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import FinancialSettingsPage from './pages/FinancialSettingsPage';
import WelcomePage from './pages/WelcomePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/welcome" replace />;
};

// Componente para rutas públicas (solo accesibles si NO estás autenticado)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/app" replace />;
};

function App() {
  // Configurar manejo de errores de extensiones del navegador
  React.useEffect(() => {
    setupErrorHandling();
  }, []);

  return (
    <AuthProvider>
      <Router>
          <Routes>
            {/* Rutas públicas de Autenticación (solo si NO está autenticado) */}
            <Route path="/welcome" element={
              <PublicRoute>
                <WelcomePage />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            } />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            
            {/* Redirección de la ruta raíz */}
            <Route path="/" element={<Navigate to="/app" replace />} />
            
            {/* Rutas protegidas de la aplicación (solo si está autenticado) */}
            <Route path="/app" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<HomePage />} />
              <Route path="transacciones" element={<TransactionsPage />} />
              <Route path="ahorros" element={<SavingsPage />} />
              <Route path="prestamos" element={<LoansPage />} />
              <Route path="analisis" element={<AnalysisPage />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="configuracion-financiera" element={<FinancialSettingsPage />} />
            </Route>
            
            {/* Redirección para rutas legacy */}
            <Route path="/transacciones" element={<Navigate to="/app/transacciones" replace />} />
            <Route path="/ahorros" element={<Navigate to="/app/ahorros" replace />} />
            <Route path="/prestamos" element={<Navigate to="/app/prestamos" replace />} />
            <Route path="/analisis" element={<Navigate to="/app/analisis" replace />} />
            <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
          </Routes>
          
          {/* Toaster para notificaciones */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
    </AuthProvider>
  );
}

export default App;