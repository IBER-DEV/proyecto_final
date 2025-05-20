import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, LogOut, Menu, X, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Notifications } from './Notifications'; // Asegúrate de que la ruta sea correcta

export function Navigation() {
  const location = useLocation();
  const { signOut, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Contracts', href: '/contracts', icon: FileText },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Educación', href: '/education', icon: GraduationCap },
    { name: 'Reports', href: '/reports', icon: FileText },

  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo y menú en móviles */}
          <div className="flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="text-xl font-bold text-blue-600 ml-2">WorkFormal</span>
          </div>

          {/* Links de navegación */}
          <div
            className={`sm:flex space-x-8 sm:static absolute top-16 left-0 w-full sm:w-auto bg-white shadow-md sm:shadow-none p-4 sm:p-0 ${
              menuOpen ? 'block' : 'hidden'
            }`}
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                    location.pathname === item.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Perfil del usuario, notificaciones y logout */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user?.full_name || 'Usuario'}</span>
            <Notifications /> {/* Integramos el componente aquí */}
            <button
              onClick={handleSignOut}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}