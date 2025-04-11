import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { Contracts } from './components/Contracts';
import { ContractDetails } from './components/ContractDetails';
import { Payments } from './components/Payments';
import {PaymentDetails} from './components/PaymentDetails';
import { Education } from './components/Education';
import { useAuthStore } from './store/authStore';
import { Chatbot } from './components/Chatbot';
import { Reports } from './components/Reports';
import { Notifications } from './components/Notifications';

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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/:id" element={<ContractDetails />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/:id" element={<PaymentDetails />} />
            <Route path="/education" element={<Education />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
        <Chatbot />
      </div>
    </BrowserRouter>
  );
}

export default App;