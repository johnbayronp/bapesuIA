import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  EyeIcon, 
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatCurrencyWithSymbol } from '../../utils/currencyFormatter';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productRatings, setProductRatings] = useState({});

  useEffect(() => {
    loadUserOrders();
  }, [currentPage, selectedStatus]);

  const loadUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las órdenes');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit));
      } else {
        throw new Error(data.error || 'Error al cargar las órdenes');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la orden');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Order details received:', data.data);
        console.log('Order items:', data.data.items);
        console.log('Order status:', data.data.status);
        console.log('Items with product_id:', data.data.items?.map(item => ({
          product_name: item.product_name,
          product_id: item.product_id,
          has_product_id: !!item.product_id
        })));
        setSelectedOrder(data.data);
        setShowOrderDetails(true);
      } else {
        throw new Error(data.error || 'Error al cargar los detalles');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error loading order details:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'processing':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'shipped':
        return <TruckIcon className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Opcional: mostrar un toast de confirmación
      console.log('Copiado al portapapeles');
    });
  };

  const handleProductRating = async (productId, rating) => {
    try {
      // Validar que el productId sea válido
      if (!productId || productId <= 0) {
        console.error('Product ID inválido:', productId);
        alert('Error: ID de producto inválido');
        return;
      }

      console.log('Enviando calificación:', { productId, rating, orderId: selectedOrder.id });

      // Actualizar estado local inmediatamente para feedback visual
      setProductRatings(prev => ({
        ...prev,
        [productId]: rating
      }));

      // Enviar calificación al backend
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/product-ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          order_id: selectedOrder.id,
          rating: rating
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Error al guardar calificación:', data.error);
        // Revertir el estado local si hay error
        setProductRatings(prev => {
          const newState = { ...prev };
          delete newState[productId];
          return newState;
        });
        alert('Error al guardar la calificación: ' + data.error);
      } else {
        console.log('Calificación guardada exitosamente');
      }
    } catch (error) {
      console.error('Error al enviar calificación:', error);
      // Revertir el estado local si hay error
      setProductRatings(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      alert('Error al guardar la calificación');
    }
  };

  const renderStars = (productId, currentRating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleProductRating(productId, i)}
          className={`p-1 transition-colors ${
            i <= currentRating 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-yellow-400'
          }`}
        >
          <StarIconSolid className="h-4 w-4" />
        </button>
      );
    }
    return stars;
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadUserOrders}
                className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Pedidos</h2>
          <p className="text-gray-600 dark:text-gray-400">Historial de tus compras y seguimiento</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadUserOrders}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <ShoppingBagIcon className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Contador */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {orders.length} pedidos encontrados
            </span>
          </div>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay pedidos</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedStatus !== 'all' 
                ? 'No se encontraron pedidos con el estado seleccionado.'
                : 'Aún no has realizado ningún pedido.'
              }
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <ShoppingBagIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {order.order_number}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusText(order.status)}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyWithSymbol(order.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Método de Pago</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.payment_method}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Envío</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.shipping_method}
                      </p>
                    </div>
                  </div>

                  {/* Estado del pedido en línea */}
                  {order.status !== 'cancelled' ? (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Estado del Pedido</p>
                      <div className="flex items-center space-x-2">
                        <div className={`flex-1 h-2 rounded-full ${order.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${order.status === 'confirmed' ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${order.status === 'processing' ? 'bg-purple-400' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${order.status === 'shipped' ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Pendiente</span>
                        <span>Confirmado</span>
                        <span>Procesando</span>
                        <span>Enviado</span>
                        <span>Entregado</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Estado del Pedido</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 rounded-full bg-red-400"></div>
                      </div>
                      <div className="flex justify-center text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        Cancelado
                      </div>
                    </div>
                  )}

                  {/* Información de tracking para pedidos enviados */}
                  {order.status === 'shipped' && (order.tracking_number || order.tracking_url) && (
                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <TruckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          Información de Seguimiento
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.tracking_number && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-indigo-700 dark:text-indigo-300">Guía:</span>
                            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                              {order.tracking_number}
                            </span>
                            <button
                              onClick={() => copyToClipboard(order.tracking_number)}
                              className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                              title="Copiar guía"
                            >
                              <ClipboardDocumentIcon className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        
                        {order.tracking_url && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-indigo-700 dark:text-indigo-300">Seguimiento:</span>
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center space-x-1"
                            >
                              <span>Ver seguimiento</span>
                              <LinkIcon className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={() => handleViewOrderDetails(order.id)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {orders.length > 0 && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNumber === currentPage
                        ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de la orden */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detalles del Pedido {selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Información del pedido */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Información del Pedido</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                      <p className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedOrder.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Subtotal</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyWithSymbol(selectedOrder.subtotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Envío</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyWithSymbol(selectedOrder.shipping_cost)}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrencyWithSymbol(selectedOrder.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información de tracking para pedidos enviados */}
                {selectedOrder.status === 'shipped' && (selectedOrder.tracking_number || selectedOrder.tracking_url) && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center space-x-2 mb-3">
                      <TruckIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        Información de Seguimiento
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedOrder.tracking_number && (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-700">
                          <div className="flex-1">
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">Número de Guía</p>
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                              {selectedOrder.tracking_number}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(selectedOrder.tracking_number)}
                            className="ml-3 p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg transition-colors"
                            title="Copiar número de guía"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      {selectedOrder.tracking_url && (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-700">
                          <div className="flex-1">
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">Link de Seguimiento</p>
                            <a
                              href={selectedOrder.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center space-x-1"
                            >
                              <span>Ver seguimiento en línea</span>
                              <LinkIcon className="h-4 w-4" />
                            </a>
                          </div>
                          <button
                            onClick={() => copyToClipboard(selectedOrder.tracking_url)}
                            className="ml-3 p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg transition-colors"
                            title="Copiar URL de seguimiento"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Información del cliente */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Información de Envío</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Nombre:</span> {selectedOrder.customer_name}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Email:</span> {selectedOrder.customer_email}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Teléfono:</span> {selectedOrder.customer_phone}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Dirección:</span> {selectedOrder.shipping_address}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Ciudad:</span> {selectedOrder.shipping_city}, {selectedOrder.shipping_state}
                    </p>
                  </div>
                </div>

                                 {/* Productos */}
                 {selectedOrder.items && selectedOrder.items.length > 0 && (
                   <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                     <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Productos</h4>
                     <div className="space-y-4">
                       {selectedOrder.items.map((item, index) => {
                         console.log(`Rendering item ${index}:`, {
                           product_name: item.product_name,
                           product_id: item.product_id,
                           order_status: selectedOrder.status,
                           should_show_stars: selectedOrder.status === 'delivered' && item.product_id
                         });
                         return (
                         <div key={index} className="border-b border-gray-200 dark:border-gray-600 last:border-b-0 pb-4">
                           <div className="flex justify-between items-start mb-2">
                             <div className="flex-1">
                               <p className="text-sm font-medium text-gray-900 dark:text-white">
                                 {item.product_name}
                               </p>
                               <p className="text-xs text-gray-500 dark:text-gray-400">
                                 Cantidad: {item.quantity} × {formatCurrencyWithSymbol(item.product_price)}
                               </p>
                             </div>
                             <div className="text-sm font-medium text-gray-900 dark:text-white">
                               {formatCurrencyWithSymbol(item.total_price)}
                             </div>
                           </div>
                           
                                                       {/* Calificación del producto - solo para pedidos entregados */}
                            {selectedOrder.status === 'delivered' && item.product_id && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Califica este producto:
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    {renderStars(item.product_id, productRatings[item.product_id] || 0)}
                                  </div>
                                </div>
                                {productRatings[item.product_id] && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Calificación: {productRatings[item.product_id]}/5 estrellas
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Mensaje para pedidos no entregados */}
                            {selectedOrder.status !== 'delivered' && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  Podrás calificar este producto cuando el pedido sea entregado
                                </p>
                              </div>
                            )}
                         </div>
                       );
                       })}
                     </div>
                   </div>
                 )}

                {/* Comentarios */}
                {selectedOrder.comments && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Comentarios</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedOrder.comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrders; 