import React from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import useCart from '../../hooks/useCart';

const CartIcon = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <div className="relative">
      <ShoppingCartIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </div>
  );
};

export default CartIcon; 