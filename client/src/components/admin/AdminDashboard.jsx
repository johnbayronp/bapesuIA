import React, { useState } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  CubeIcon, 
  TagIcon, 
  UsersIcon, 
  ChartBarIcon,
  CogIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

// Componentes de las secciones
import AdminHome from './sections/AdminHome';
import OrdersManagement from './sections/OrdersManagement';
import ProductsManagement from './sections/ProductsManagement';
import DiscountsManagement from './sections/DiscountsManagement';
import UsersManagement from './sections/UsersManagement';
import Analytics from './sections/Analytics';
import Settings from './sections/Settings';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Inicio', href: '/admin', icon: HomeIcon, current: location.pathname === '/admin' },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCartIcon, current: location.pathname === '/admin/orders' },
    { name: 'Productos', href: '/admin/products', icon: CubeIcon, current: location.pathname === '/admin/products' },
    { name: 'Descuentos', href: '/admin/discounts', icon: TagIcon, current: location.pathname === '/admin/discounts' },
    { name: 'Usuarios', href: '/admin/users', icon: UsersIcon, current: location.pathname === '/admin/users' },
    { name: 'Analíticas', href: '/admin/analytics', icon: ChartBarIcon, current: location.pathname === '/admin/analytics' },
    { name: 'Configuración', href: '/admin/settings', icon: CogIcon, current: location.pathname === '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Panel Admin
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    item.current
                      ? 'text-indigo-500 dark:text-indigo-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="md:pl-64">
        {/* Header móvil */}
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Panel Admin
            </h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido de las rutas */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/products" element={<ProductsManagement />} />
            <Route path="/discounts" element={<DiscountsManagement />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 