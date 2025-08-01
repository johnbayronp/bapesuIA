import React from 'react';
import { 
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatCurrencyWithSymbol } from '../../utils/currencyFormatter';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onAddToWishlist, 
  isInWishlist,
  showDiscount = true,
  maxDescriptionLength = 100,
  onImageClick
}) => {
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    
    // Buscar el último espacio antes del límite
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) { // Si hay un espacio cerca del final
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  };

  const renderStars = (rating) => {
    const stars = [];
    
    // Si no hay calificación, mostrar todas las estrellas vacías
    if (!rating || rating === 0) {
      for (let i = 0; i < 5; i++) {
        stars.push(<StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
      }
      return stars;
    }
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="w-4 h-4 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      {/* Imagen del producto */}
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 md:h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300"
          onClick={onImageClick}
        />
                 {/* Etiqueta de descuento */}
         {showDiscount && product.discount && product.discount > 0 && (
           <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs md:text-sm font-bold">
             -{product.discount}%
           </div>
         )}
      </div>

      {/* Contenido del producto */}
      <div className="p-3 md:p-4">
        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2">
          {truncateText(product.name, 30)}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm mb-2 md:mb-3">
          {truncateText(product.description, 60)}
        </p>

        {/* Calificación */}
        <div className="flex items-center mb-2 md:mb-3">
          <div className="flex items-center">
            {renderStars(product.rating)}
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm ml-2">
            {product.reviews > 0 ? `(${product.reviews})` : '(Sin calificaciones)'}
          </span>
        </div>

                 {/* Precios */}
         <div className="flex items-center mb-3 md:mb-4">
           <span className="text-lg md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
             {formatCurrencyWithSymbol(product.price)}
           </span>
           {product.originalPrice && product.discount && product.discount > 0 && product.originalPrice > product.price && (
             <span className="text-gray-400 line-through ml-2 text-sm md:text-base">
               {formatCurrencyWithSymbol(product.originalPrice)}
             </span>
           )}
         </div>

        {/* Botones de acción */}
        <div className="flex space-x-2">
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 md:px-4 rounded-lg transition-colors duration-300 text-xs md:text-sm"
          >
            Agregar al Carrito
          </button>
          <button
            onClick={() => onAddToWishlist(product)}
            className={`p-2 rounded-lg transition-colors duration-300 ${
              isInWishlist(product.id)
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            <HeartIcon className={`h-4 w-4 md:h-5 md:w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 