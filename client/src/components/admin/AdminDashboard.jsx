import React, { useState } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  CubeIcon, 
  TagIcon, 
  UsersIcon, 
  ChartBarIcon,
  CogIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">


      {/* Sidebar */}
      <div className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Botón de collapse del sidebar (mejor UX) */}
        <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <nav className="px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                <Link
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon
                    className={`h-5 w-5 ${
                      item.current
                        ? 'text-indigo-500 dark:text-indigo-400'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    } ${sidebarCollapsed ? '' : 'mr-3'}`}
                  />
                  {!sidebarCollapsed && item.name}
                </Link>
                
                {/* Tooltip para sidebar colapsado */}
                {sidebarCollapsed && item.current && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap z-50">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-l-0 border-r-4 border-t-2 border-b-2 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className={`pt-16 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}>
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
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Contenido de las rutas */}
        <main className="p-4 pb-20">
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