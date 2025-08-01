import React from 'react';
import { 
  XMarkIcon,
  HeartIcon,
  StarIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatCurrencyWithSymbol } from '../../utils/currencyFormatter';

const ProductModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  onAddToWishlist, 
  isInWishlist 
}) => {
  if (!isOpen || !product) return null;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="w-5 h-5 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }

    return stars;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Detalles del Producto
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagen del producto */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-80 lg:h-96 object-cover rounded-lg"
                />
                {product.discount && product.discount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-lg font-bold">
                    -{product.discount}%
                  </div>
                )}
              </div>
            </div>

            {/* Información del producto */}
            <div className="space-y-6">
              {/* Nombre y descripción */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {product.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Calificación */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {renderStars(product.rating)}
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-lg">
                  ({product.reviews} reseñas)
                </span>
              </div>

              {/* Precios */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl lg:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrencyWithSymbol(product.price)}
                  </span>
                  {product.originalPrice && product.discount && product.discount > 0 && product.originalPrice > product.price && (
                    <span className="text-xl text-gray-400 line-through">
                      {formatCurrencyWithSymbol(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.discount && product.discount > 0 && (
                  <p className="text-green-600 dark:text-green-400 text-lg font-semibold">
                    ¡Ahorras {formatCurrencyWithSymbol(product.originalPrice - product.price)}!
                  </p>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-lg ${product.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {product.inStock ? 'En stock' : 'Agotado'}
                </span>
              </div>

              {/* Categoría */}
              {product.category && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-lg">Categoría: </span>
                  <span className="text-gray-900 dark:text-white text-lg font-medium">
                    {product.category}
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  disabled={!product.inStock}
                  className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span>Agregar al Carrito</span>
                </button>
                <button
                  onClick={() => onAddToWishlist(product)}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors duration-300 ${
                    isInWishlist(product.id)
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-pink-500 hover:bg-pink-600 text-white'
                  }`}
                >
                  <HeartIcon className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  <span>{isInWishlist(product.id) ? 'En Favoritos' : 'Agregar a Favoritos'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal; 