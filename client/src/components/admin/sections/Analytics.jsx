import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import useToast from '../../../hooks/useToast';

const Analytics = () => {
  const [stats, setStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Cargar estadísticas de analíticas
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats([
            {
              name: 'Ventas Totales',
              value: `$${statsData.data.total_sales?.toLocaleString() || '0'}`,
              change: statsData.data.sales_change || '+0%',
              changeType: statsData.data.sales_change?.startsWith('+') ? 'positive' : 'negative',
              icon: ArrowTrendingUpIcon,
              color: 'bg-blue-500'
            },
            {
              name: 'Pedidos',
              value: statsData.data.total_orders?.toLocaleString() || '0',
              change: statsData.data.orders_change || '+0%',
              changeType: statsData.data.orders_change?.startsWith('+') ? 'positive' : 'negative',
              icon: ShoppingCartIcon,
              color: 'bg-green-500'
            },
            {
              name: 'Usuarios',
              value: statsData.data.total_users?.toLocaleString() || '0',
              change: statsData.data.users_change || '+0%',
              changeType: statsData.data.users_change?.startsWith('+') ? 'positive' : 'negative',
              icon: UsersIcon,
              color: 'bg-purple-500'
            },
            {
              name: 'Conversión',
              value: `${statsData.data.conversion_rate?.toFixed(1) || '0'}%`,
              change: statsData.data.conversion_change || '+0%',
              changeType: statsData.data.conversion_change?.startsWith('+') ? 'positive' : 'negative',
              icon: ChartBarIcon,
              color: 'bg-yellow-500'
            }
          ]);
        }
      }

      // Cargar productos más vendidos
      const topProductsResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/top-products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (topProductsResponse.ok) {
        const topProductsData = await topProductsResponse.json();
        if (topProductsData.success) {
          setTopProducts(topProductsData.data.map(product => ({
            name: product.name,
            sales: product.sales || 0,
            revenue: product.revenue
          })));
        }
      }

      // Cargar actividad reciente
      const activityResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/recent-activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success) {
          setRecentActivity(activityData.data.map(activity => ({
            action: activity.action,
            user: activity.user_name || 'Sistema',
            time: formatTimeAgo(activity.created_at)
          })));
        }
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
      showError('Error al cargar los datos de analíticas');

      // Datos de fallback
      setStats([
        { name: 'Ventas Totales', value: '$0', change: '+0%', changeType: 'positive', icon: ArrowTrendingUpIcon, color: 'bg-blue-500' },
        { name: 'Pedidos', value: '0', change: '+0%', changeType: 'positive', icon: ShoppingCartIcon, color: 'bg-green-500' },
        { name: 'Usuarios', value: '0', change: '+0%', changeType: 'positive', icon: UsersIcon, color: 'bg-purple-500' },
        { name: 'Conversión', value: '0%', change: '+0%', changeType: 'positive', icon: ChartBarIcon, color: 'bg-yellow-500' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/refresh-metrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Métricas actualizadas exitosamente');
        // Recargar los datos de analíticas
        await loadAnalyticsData();
      } else {
        showError(data.error || 'Error al actualizar métricas');
      }
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      showError('Error al actualizar métricas');
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} días`;

    return date.toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analíticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cargando métricas...
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de actualización */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analíticas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Métricas y estadísticas del sistema
          </p>
        </div>
        <button
          onClick={refreshMetrics}
          disabled={refreshing}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            refreshing ? 'animate-pulse' : ''
          }`}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar Métricas'}
        </button>
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
            {topProducts.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay datos de productos vendidos</p>
              </div>
            )}
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
            {recentActivity.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay actividad reciente</p>
              </div>
            )}
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