import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPinIcon, 
  CreditCardIcon, 
  TruckIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useEcommerce } from '../context/EcommerceContext';
import { formatCurrencyWithSymbol } from '../utils/currencyFormatter';
import { supabase } from '../lib/supabase';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotalFormatted, clearCart } = useEcommerce();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Información personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Dirección de envío
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Colombia',
    
    // Método de pago
    paymentMethod: 'transfer',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    
    // Envío
    shippingMethod: 'interrapidisimo_bogota',
    
    // Comentarios
    comments: ''
  });

  const shippingMethods = [
    {
      id: 'interrapidisimo_bogota',
      name: 'Interrapidisimo Bogotá',
      description: '1-2 días hábiles',
      price: 10000,
      icon: TruckIcon
    },
    {
      id: 'interrapidisimo_other_cities',
      name: 'Interrapidisimo Otras Ciudades',
      description: '2-3 días hábiles',
      price: 14500,
      icon: TruckIcon
    }
  ];

  const paymentMethods = [
    {
      id: 'transfer',
      name: 'Transferencia Bancaria',
      description: 'Transferencia directa a cuenta bancaria',
      icon: CreditCardIcon
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.paymentMethod === 'transfer') {
      try {
        // Preparar datos de la orden para la base de datos
        const orderData = {
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_zip_code: formData.zipCode,
          shipping_country: formData.country,
          subtotal: subtotal,
          shipping_cost: shippingCost,
          total_amount: total,
          payment_method: formData.paymentMethod,
          shipping_method: selectedShipping?.name || 'Interrapidisimo',
          status: 'pending',
          comments: formData.comments,
          whatsapp_sent: true,
          items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        };

        // Guardar la orden en la base de datos
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) {
          throw new Error('Error al guardar la orden');
        }

        const orderResult = await response.json();
        
        if (!orderResult.success) {
          throw new Error(orderResult.error || 'Error al crear la orden');
        }

        // Preparar información de la transferencia para WhatsApp
        const orderInfo = {
          customer: orderData.customer_name,
          email: orderData.customer_email,
          phone: orderData.customer_phone,
          address: `${orderData.shipping_address}, ${orderData.shipping_city}, ${orderData.shipping_state}`,
          items: cart.map(item => `${item.name} x${item.quantity}`).join(', '),
          subtotal: formatCurrencyWithSymbol(subtotal),
          shipping: formatCurrencyWithSymbol(shippingCost),
          total: formatCurrencyWithSymbol(total),
          shippingMethod: orderData.shipping_method,
          orderNumber: orderResult.data.order_number
        };
        
        // Crear mensaje para WhatsApp
        const message = `*NUEVO PEDIDO - TRANSFERENCIA BANCARIA*

*Número de Orden:* ${orderInfo.orderNumber}
*Cliente:* ${orderInfo.customer}
*Email:* ${orderInfo.email}
*Teléfono:* ${orderInfo.phone}
*Dirección:* ${orderInfo.address}

*Productos:*
${orderInfo.items}

*Resumen:*
Subtotal: ${orderInfo.subtotal}
Envío: ${orderInfo.shipping}
*Total: ${orderInfo.total}*

*Método de Envío:* ${orderInfo.shippingMethod}

Por favor, proporciona los datos bancarios para la transferencia.`;
        
        // Codificar el mensaje para WhatsApp
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/573153791422?text=${encodedMessage}`;
        
        // Abrir WhatsApp en nueva ventana
        window.open(whatsappUrl, '_blank');
        
        // Limpiar carrito y redirigir
        clearCart();
        navigate('/checkout-success');
        
      } catch (error) {
        console.error('Error en el checkout:', error);
        alert('Error al procesar la orden. Por favor, intenta de nuevo.');
      }
    } else {
      // Simular procesamiento de pago para otros métodos
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        clearCart();
        navigate('/checkout-success');
      } catch (error) {
        console.error('Error en el checkout:', error);
      }
    }
  };

  const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethod);
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const total = subtotal + shippingCost;

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && 
               formData.phone && formData.address && formData.city && 
               formData.state && formData.zipCode;
      case 2:
        return formData.shippingMethod;
      case 3:
        return formData.paymentMethod;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Información Personal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2" />
          Dirección de Envío
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Calle, número, apartamento"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departamento *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código Postal *
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <TruckIcon className="h-5 w-5 mr-2" />
        Método de Envío
      </h3>
      <div className="space-y-3">
        {shippingMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.shippingMethod === method.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input
              type="radio"
              name="shippingMethod"
              value={method.id}
              checked={formData.shippingMethod === method.id}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  formData.shippingMethod === method.id
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-gray-300'
                }`}>
                  {formData.shippingMethod === method.id && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {method.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {method.description}
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {formatCurrencyWithSymbol(method.price)}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <CreditCardIcon className="h-5 w-5 mr-2" />
        Método de Pago
      </h3>
      
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.paymentMethod === method.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={formData.paymentMethod === method.id}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex items-center w-full">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                formData.paymentMethod === method.id
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-gray-300'
              }`}>
                {formData.paymentMethod === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {method.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {method.description}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {formData.paymentMethod === 'transfer' && (
        <div className="mt-6 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Información de Transferencia Bancaria
          </h4>
          <div className="space-y-3 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              Al confirmar tu pedido, se abrirá WhatsApp automáticamente con toda la información de tu orden para que puedas coordinar la transferencia bancaria.
            </p>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <strong>Lo que se enviará por WhatsApp:</strong>
              </p>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-xs">
                <li>• Datos del cliente (nombre, email, teléfono)</li>
                <li>• Dirección de envío</li>
                <li>• Lista de productos y cantidades</li>
                <li>• Resumen de costos (subtotal, envío, total)</li>
                <li>• Método de envío seleccionado</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Comentarios Adicionales
        </label>
        <textarea
          name="comments"
          value={formData.comments}
          onChange={handleInputChange}
          rows={3}
          placeholder="Instrucciones especiales para la entrega..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  );

  const renderOrderSummary = () => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Resumen del Pedido
      </h3>
      
      <div className="space-y-3 mb-4">
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="flex items-center">
              <img
                src={item.image}
                alt={item.name}
                className="w-10 h-10 object-cover rounded mr-3"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Cantidad: {item.quantity}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-white">
                {formatCurrencyWithSymbol(item.price * item.quantity)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
          <span className="font-medium">{formatCurrencyWithSymbol(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Envío:</span>
          <span className="font-medium">{formatCurrencyWithSymbol(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold">
          <span className="text-gray-900 dark:text-white">Total:</span>
          <span className="text-indigo-600 dark:text-indigo-400">
            {formatCurrencyWithSymbol(total)}
          </span>
        </div>
      </div>
    </div>
  );

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Si no está autenticado, redirigir al login con información de que viene del checkout
          navigate('/login', { state: { from: { pathname: '/checkout' } } });
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const steps = [
    { number: 1, title: 'Información', icon: CheckIcon },
    { number: 2, title: 'Envío', icon: TruckIcon },
    { number: 3, title: 'Pago', icon: CreditCardIcon }
  ];

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (ya redirigió)
  if (!isAuthenticated) {
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Carrito Vacío
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No hay productos en tu carrito para proceder al checkout.
          </p>
          <button
            onClick={() => navigate('/tienda')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Ir a la Tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/tienda')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver a la Tienda
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Finalizar Compra
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500'
                }`}>
                  {currentStep > step.number ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Paso {currentStep} de 3: {steps[currentStep - 1].title}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <form onSubmit={handleSubmit}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      currentStep === 1
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Anterior
                  </button>

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        isStepValid()
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Siguiente
                    </button>
                  ) : (
                                         <button
                       type="submit"
                       disabled={!isStepValid()}
                       className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                         isStepValid()
                           ? 'bg-green-600 hover:bg-green-700 text-white'
                           : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                       }`}
                     >
                       {formData.paymentMethod === 'transfer' ? 'Enviar por WhatsApp' : 'Confirmar Pedido'}
                     </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {renderOrderSummary()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 