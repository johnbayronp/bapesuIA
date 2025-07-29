import React from 'react';
import { 
  ShoppingCartIcon, 
  CubeIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const AdminHome = () => {
  // Datos de ejemplo - en una implementación real vendrían de la API
  const stats = [
    {
      name: 'Pedidos Totales',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: ShoppingCartIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Productos Activos',
      value: '89',
      change: '+5%',
      changeType: 'positive',
      icon: CubeIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Usuarios Registrados',
      value: '2,456',
      change: '+8%',
      changeType: 'positive',
      icon: UsersIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Ingresos del Mes',
      value: '$45,678',
      change: '+15%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500'
    }
  ];

  const recentOrders = [
    {
      id: '#ORD-001',
      customer: 'Juan Pérez',
      amount: '$299.99',
      status: 'Completado',
      date: '2024-01-15'
    },
    {
      id: '#ORD-002',
      customer: 'María García',
      amount: '$149.50',
      status: 'En Proceso',
      date: '2024-01-14'
    },
    {
      id: '#ORD-003',
      customer: 'Carlos López',
      amount: '$89.99',
      status: 'Pendiente',
      date: '2024-01-13'
    }
  ];

  const alerts = [
    {
      type: 'warning',
      message: 'Stock bajo en Producto XYZ',
      time: 'Hace 2 horas'
    },
    {
      type: 'info',
      message: 'Nuevo pedido recibido',
      time: 'Hace 1 hora'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Panel de Administración
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bienvenido al panel de control de tu tienda
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                vs mes anterior
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos Recientes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Pedidos Recientes
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ShoppingCartIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.id}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.customer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.amount}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'Completado' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : order.status === 'En Proceso'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="w-full px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-md">
                Ver todos los pedidos
              </button>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Alertas
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
                    alert.type === 'warning' 
                      ? 'text-yellow-500' 
                      : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Acciones Rápidas
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              <CubeIcon className="h-5 w-5 mr-2" />
              Agregar Producto
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <TagIcon className="h-5 w-5 mr-2" />
              Crear Descuento
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <UsersIcon className="h-5 w-5 mr-2" />
              Gestionar Usuarios
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Ver Reportes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome; 