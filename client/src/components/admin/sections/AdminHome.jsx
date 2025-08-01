import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import useToast from '../../../hooks/useToast';

const AdminHome = () => {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Cargar estadísticas generales
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/stats`, {
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
              name: 'Pedidos Totales',
              value: statsData.data.total_orders?.toLocaleString() || '0',
              change: statsData.data.orders_change || '+0%',
              changeType: statsData.data.orders_change?.startsWith('+') ? 'positive' : 'negative',
              icon: ShoppingCartIcon,
              color: 'bg-blue-500'
            },
            {
              name: 'Productos Activos',
              value: statsData.data.total_products?.toLocaleString() || '0',
              change: statsData.data.products_change || '+0%',
              changeType: statsData.data.products_change?.startsWith('+') ? 'positive' : 'negative',
              icon: CubeIcon,
              color: 'bg-green-500'
            },
            {
              name: 'Usuarios Registrados',
              value: statsData.data.total_users?.toLocaleString() || '0',
              change: statsData.data.users_change || '+0%',
              changeType: statsData.data.users_change?.startsWith('+') ? 'positive' : 'negative',
              icon: UsersIcon,
              color: 'bg-purple-500'
            },
            {
              name: 'Ingresos del Mes',
              value: `$${statsData.data.monthly_revenue?.toLocaleString() || '0'}`,
              change: statsData.data.revenue_change || '+0%',
              changeType: statsData.data.revenue_change?.startsWith('+') ? 'positive' : 'negative',
              icon: CurrencyDollarIcon,
              color: 'bg-yellow-500'
            }
          ]);
        }
      }

      // Cargar pedidos recientes
      const ordersResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/orders?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.success) {
          setRecentOrders(ordersData.data.slice(0, 5).map(order => ({
            id: order.order_number || `#${order.id}`,
            customer: order.customer_name || 'Cliente',
            amount: `$${parseFloat(order.total_amount || 0).toFixed(2)}`,
            status: order.status || 'Pendiente',
            date: new Date(order.created_at).toLocaleDateString('es-ES')
          })));
        }
      }

      // Cargar alertas del sistema
      const alertsResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        if (alertsData.success) {
          setAlerts(alertsData.data || []);
        }
      } else {
        // Si no hay endpoint de alertas, crear alertas básicas basadas en datos
        const basicAlerts = [];
        if (statsData.data?.low_stock_products > 0) {
          basicAlerts.push({
            type: 'warning',
            message: `${statsData.data.low_stock_products} productos con stock bajo`,
            time: 'Reciente'
          });
        }
        if (statsData.data?.pending_orders > 0) {
          basicAlerts.push({
            type: 'info',
            message: `${statsData.data.pending_orders} pedidos pendientes`,
            time: 'Reciente'
          });
        }
        setAlerts(basicAlerts);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error al cargar los datos del dashboard');

      // Datos de fallback
      setStats([
        { name: 'Pedidos Totales', value: '0', change: '+0%', changeType: 'positive', icon: ShoppingCartIcon, color: 'bg-blue-500' },
        { name: 'Productos Activos', value: '0', change: '+0%', changeType: 'positive', icon: CubeIcon, color: 'bg-green-500' },
        { name: 'Usuarios Registrados', value: '0', change: '+0%', changeType: 'positive', icon: UsersIcon, color: 'bg-purple-500' },
        { name: 'Ingresos del Mes', value: '$0', change: '+0%', changeType: 'positive', icon: CurrencyDollarIcon, color: 'bg-yellow-500' }
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
        // Recargar los datos del dashboard
        await loadDashboardData();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cargando datos...
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
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Resumen general del sistema
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
            {recentOrders.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay pedidos recientes</p>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/admin/orders'}
                className="w-full px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-md"
              >
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
            {alerts.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay alertas activas</p>
              </div>
            )}
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
            <button
              onClick={() => window.location.href = '/admin/products'}
              className="flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <CubeIcon className="h-5 w-5 mr-2" />
              Agregar Producto
            </button>
            <button
              onClick={() => window.location.href = '/admin/discounts'}
              className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <TagIcon className="h-5 w-5 mr-2" />
              Crear Descuento
            </button>
            <button
              onClick={() => window.location.href = '/admin/users'}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Gestionar Usuarios
            </button>
            <button
              onClick={() => window.location.href = '/admin/analytics'}
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
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