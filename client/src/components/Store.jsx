import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { useEcommerce } from '../context/EcommerceContext';
import CartSidebar from './common/CartSidebar';
import CartFloatingButton from './common/FloatingButtons';
import ProductCard from './shared/ProductCard';
import LocationIndicator from './common/LocationIndicator';
import { supabase } from '../lib/supabase';
import useToast from '../hooks/useToast';

const Store = () => {
  const getDefaultCategories = () => {
    return [
      { id: 'todos', name: 'Todos', icon: '🛍️' },
      { id: 'ropa', name: 'Ropa', icon: '👕' },
      { id: 'tecnologia', name: 'Tecnología', icon: '💻' },
      { id: 'hogar', name: 'Hogar', icon: '🏠' },
      { id: 'deportes', name: 'Deportes', icon: '⚽' }
    ];
  };

  const {
    products,
    categories,
    loading,
    selectedCategory,
    searchTerm,
    isCartOpen,
    setLoading,
    setProducts,
    setCategories,
    setSelectedCategory,
    setSearchTerm,
    setCartOpen,
    addToCart,
    addToWishlist,
    isInWishlist,
    getCartCount,
    getFilteredProducts
  } = useEcommerce();

  const { showSuccess, showInfo } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const handleAddToCart = async (product) => {
    // Verificar si el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Si no está autenticado, agregar al carrito pero mostrar mensaje
      addToCart(product);
      showInfo('Producto agregado al carrito. Debes iniciar sesión para proceder al pago.');
      return;
    }
    
    // Si está autenticado, agregar normalmente
    addToCart(product);
    // No mostrar toast aquí porque addToCart ya lo hace
  };



  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Preparar headers - solo incluir Authorization si hay token
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transformar los productos para que tengan el formato esperado
          const transformedProducts = data.data.data.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description || 'Sin descripción',
            price: parseFloat(product.price),
            originalPrice: parseFloat(product.price) * 1.25, // Simular precio original
            discount: 20, // Descuento fijo del 20%
            category: product.category,
            rating: 4.5, // Rating fijo por ahora
            reviews: Math.floor(Math.random() * 200) + 50, // Reviews aleatorias
            image: product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
            inStock: product.stock > 0
          }));
          setProducts(transformedProducts);
        }
      } else {
        console.error('Products API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Preparar headers - solo incluir Authorization si hay token
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Categories response:', data); // Para debug
        
        if (data.success && data.data && data.data.data) {
          // Agregar la opción "Todos" al inicio
          const allCategories = [
            { id: 'todos', name: 'Todos', icon: '🛍️' },
            ...data.data.data.map(category => ({
              id: category.id,
              name: category.name,
              icon: getCategoryIcon(category.name)
            }))
          ];
          setCategories(allCategories);
        } else if (data.success && Array.isArray(data.data)) {
          // Si la estructura es diferente
          const allCategories = [
            { id: 'todos', name: 'Todos', icon: '🛍️' },
            ...data.data.map(category => ({
              id: category.id,
              name: category.name,
              icon: getCategoryIcon(category.name)
            }))
          ];
          setCategories(allCategories);
        } else {
          console.error('Unexpected categories data structure:', data);
          // Usar categorías por defecto
          setCategories(getDefaultCategories());
        }
      } else {
        console.error('Categories API error:', response.status, response.statusText);
        // Usar categorías por defecto
        setCategories(getDefaultCategories());
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Usar categorías por defecto
      setCategories(getDefaultCategories());
    }
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Ropa': '👕',
      'Tecnología': '💻',
      'Hogar': '🏠',
      'Deportes': '⚽',
      'Electrónicos': '📱',
      'Libros': '📚',
      'Juguetes': '🎮',
      'Belleza': '💄',
      'Automóviles': '🚗',
      'Jardín': '🌱'
    };
    return iconMap[categoryName] || '🛍️';
  };



    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner para usuarios no autenticados */}
      {!isAuthenticated && (
        <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center text-sm">
              <span className="text-blue-800 dark:text-blue-200">
                🛒 Puedes agregar productos al carrito sin registrarte. 
                <span className="font-semibold ml-1">
                  Deberás iniciar sesión para proceder al pago.
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header de la tienda */}
      <div className="text-center py-12 px-4">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBagIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mr-4" />
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            Nuestra Tienda
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Descubre productos increíbles a precios increíbles
        </p>
      </div>

      {/* Filtros de categorías */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {categories.map((category) => (
                         <button
               key={category.name}
               onClick={() => setSelectedCategory(category.name)}
               className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                 selectedCategory === category.name
                   ? 'bg-indigo-600 text-white shadow-lg'
                   : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
               }`}
             >
              <span className="text-lg">{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Barra de búsqueda */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                         <input
               type="text"
               placeholder="Buscar productos..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
             />
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                 {loading ? (
           <div className="text-center py-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
             <p className="text-gray-600 dark:text-gray-300 mt-4">Cargando productos...</p>
           </div>
         ) : (
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getFilteredProducts().map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={addToWishlist}
                isInWishlist={isInWishlist}
                showDiscount={true}
              />
            ))}
          </div>
        )}

                                   {/* Mensaje cuando no hay productos */}
          {!loading && getFilteredProducts().length === 0 && (
           <div className="text-center py-12">
             <p className="text-gray-600 dark:text-gray-300 text-lg">
               No se encontraron productos que coincidan con tu búsqueda.
             </p>
           </div>
                  )}
               </div>
        
                          {/* Cart Floating Button */}
         <CartFloatingButton />
        
                 {/* Cart Sidebar */}
         <CartSidebar isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
      </div>
    );
  };

export default Store; 