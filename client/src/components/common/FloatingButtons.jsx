import React from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useEcommerce } from '../../context/EcommerceContext';

const CartFloatingButton = () => {
  const { getCartCount, setCartOpen } = useEcommerce();

  return (
    <div className="fixed bottom-6 left-6 z-30 md:bottom-8 md:left-8">
      {/* Floating Action Button - Carrito */}
      <div className="relative group">
        <button
          onClick={() => setCartOpen(true)}
          className={`p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
            getCartCount() > 0 ? 'animate-pulse' : ''
          }`}
          aria-label="Abrir carrito"
        >
          <div className="relative">
            <ShoppingCartIcon className="h-6 w-6 md:h-7 md:w-7" />
            {getCartCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                {getCartCount() > 99 ? '99+' : getCartCount()}
              </span>
            )}
          </div>
        </button>
        
        {/* Tooltip - Solo visible en desktop */}
        <div className="hidden md:block absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Ver carrito ({getCartCount()} items)
        </div>
      </div>
    </div>
  );
};

export default CartFloatingButton; 