import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon,
  ShoppingBagIcon,
  HomeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const CheckoutSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ¡Pedido Confirmado!
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Tu pedido ha sido procesado exitosamente. Recibirás un email de confirmación con los detalles de tu compra.
        </p>

        {/* Order Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <ShoppingBagIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Detalles del Pedido
            </h2>
          </div>
          
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Número de Pedido:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                #{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('es-CO')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Estado:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                Confirmado
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Próximos Pasos
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• Recibirás un email de confirmación en los próximos minutos</p>
            <p>• Tu pedido será procesado y enviado según el método seleccionado</p>
            <p>• Te enviaremos actualizaciones sobre el estado de tu envío</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Volver al Inicio
          </button>
          
          <button
            onClick={() => navigate('/tienda')}
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            Continuar Comprando
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>¿Tienes alguna pregunta?</p>
          <p>Contáctanos en: <span className="text-indigo-600 dark:text-indigo-400">soporte@bapesu.com</span></p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess; 