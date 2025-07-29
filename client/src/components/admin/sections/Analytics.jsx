import React from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const Analytics = () => {
  // Datos de ejemplo
  const stats = [
    {
      name: 'Ventas Totales',
      value: '$45,678',
      change: '+12%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Pedidos',
      value: '1,234',
      change: '+8%',
      changeType: 'positive',
      icon: ShoppingCartIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Usuarios',
      value: '2,456',
      change: '+15%',
      changeType: 'positive',
      icon: UsersIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Conversión',
      value: '3.2%',
      change: '+2%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'bg-yellow-500'
    }
  ];

  const topProducts = [
    { name: 'Producto A', sales: 234, revenue: '$12,345' },
    { name: 'Producto B', sales: 189, revenue: '$9,876' },
    { name: 'Producto C', sales: 156, revenue: '$7,654' },
    { name: 'Producto D', sales: 123, revenue: '$6,543' }
  ];

  const recentActivity = [
    { action: 'Nuevo pedido', user: 'Juan Pérez', time: 'Hace 5 minutos' },
    { action: 'Producto agregado', user: 'Admin', time: 'Hace 1 hora' },
    { action: 'Usuario registrado', user: 'María García', time: 'Hace 2 horas' },
    { action: 'Descuento creado', user: 'Admin', time: 'Hace 3 horas' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analíticas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Métricas y estadísticas de tu tienda
        </p>
      </div>

      {/* Estadísticas principales */}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos más vendidos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Productos Más Vendidos
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.sales} ventas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.revenue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Actividad Reciente
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Ventas por Mes
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Gráfico de ventas</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Distribución de Usuarios
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Gráfico de usuarios</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 