import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Auth } from './components/Auth';
import { useAuthStore } from './store/authStore';
import { Chatbot } from './components/Chatbot';

// Lazy loading de componentes
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Contracts = lazy(() => import('./components/Contracts').then(module => ({ default: module.Contracts })));
const ContractDetails = lazy(() => import('./components/ContractDetails').then(module => ({ default: module.ContractDetails })));
const Payments = lazy(() => import('./components/Payments').then(module => ({ default: module.Payments })));
const PaymentDetails = lazy(() => import('./components/PaymentDetails').then(module => ({ default: module.PaymentDetails })));
const Education = lazy(() => import('./components/Education').then(module => ({ default: module.Education })));
const Reports = lazy(() => import('./components/Reports').then(module => ({ default: module.Reports })));
const Notifications = lazy(() => import('./components/Notifications').then(module => ({ default: module.Notifications })));

// Componente de carga para Suspense
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const { user, loading, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Muestra el spinner solo mientras se está inicializando
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no hay usuario autenticado, muestra el componente Auth
  if (!user) {
    return <Auth />;
  }
  
  // Si hay usuario autenticado, muestra la aplicación principal
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:id" element={<ContractDetails />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/payments/:id" element={<PaymentDetails />} />
              <Route path="/education" element={<Education />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </Suspense>
        </main>
        <Chatbot />
      </div>
    </BrowserRouter>
  );
}

export default App;