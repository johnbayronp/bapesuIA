import React, { createContext, useContext, useReducer, useEffect } from 'react';
import useToast from '../hooks/useToast';
import { formatCurrencyWithSymbol } from '../utils/currencyFormatter';

// Estado inicial
const initialState = {
  cart: [],
  wishlist: [],
  products: [],
  categories: [],
  loading: false,
  error: null,
  selectedCategory: 'Todos',
  searchTerm: '',
  isCartOpen: false
};

// Tipos de acciones
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_CART_QUANTITY: 'UPDATE_CART_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
  REMOVE_FROM_WISHLIST: 'REMOVE_FROM_WISHLIST',
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_CART_OPEN: 'SET_CART_OPEN',
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE'
};

// Reducer
const ecommerceReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ACTIONS.SET_PRODUCTS:
      return { ...state, products: action.payload };
    
    case ACTIONS.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    
    case ACTIONS.ADD_TO_CART:
      const existingCartItem = state.cart.find(item => item.id === action.payload.id);
      if (existingCartItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
              : item
          )
        };
      } else {
        return {
          ...state,
          cart: [...state.cart, { ...action.payload, quantity: action.payload.quantity || 1 }]
        };
      }
    
    case ACTIONS.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };
    
    case ACTIONS.UPDATE_CART_QUANTITY:
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.id !== action.payload.productId)
        };
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case ACTIONS.CLEAR_CART:
      return { ...state, cart: [] };
    
    case ACTIONS.ADD_TO_WISHLIST:
      const existsInWishlist = state.wishlist.find(item => item.id === action.payload.id);
      if (!existsInWishlist) {
        return {
          ...state,
          wishlist: [...state.wishlist, action.payload]
        };
      }
      return state;
    
    case ACTIONS.REMOVE_FROM_WISHLIST:
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.id !== action.payload)
      };
    
    case ACTIONS.SET_SELECTED_CATEGORY:
      return { ...state, selectedCategory: action.payload };
    
    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
    
    case ACTIONS.SET_CART_OPEN:
      return { ...state, isCartOpen: action.payload };
    
    case ACTIONS.LOAD_FROM_STORAGE:
      return {
        ...state,
        cart: action.payload.cart || [],
        wishlist: action.payload.wishlist || []
      };
    
    default:
      return state;
  }
};

// Crear el contexto
const EcommerceContext = createContext();

// Provider del contexto
export const EcommerceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ecommerceReducer, initialState);
  const { showSuccess, showError } = useToast();

  // Cargar datos desde localStorage al inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    
    if (savedCart || savedWishlist) {
      dispatch({
        type: ACTIONS.LOAD_FROM_STORAGE,
        payload: {
          cart: savedCart ? JSON.parse(savedCart) : [],
          wishlist: savedWishlist ? JSON.parse(savedWishlist) : []
        }
      });
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // Guardar wishlist en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  // Funciones de acción
  const actions = {
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    setProducts: (products) => dispatch({ type: ACTIONS.SET_PRODUCTS, payload: products }),
    setCategories: (categories) => dispatch({ type: ACTIONS.SET_CATEGORIES, payload: categories }),
    
    addToCart: (product, quantity = 1) => {
      dispatch({ type: ACTIONS.ADD_TO_CART, payload: { ...product, quantity } });
      showSuccess(`${product.name} agregado al carrito`);
    },
    
    removeFromCart: (productId) => {
      dispatch({ type: ACTIONS.REMOVE_FROM_CART, payload: productId });
      showSuccess('Producto removido del carrito');
    },
    
    updateCartQuantity: (productId, quantity) => {
      dispatch({ type: ACTIONS.UPDATE_CART_QUANTITY, payload: { productId, quantity } });
    },
    
    clearCart: () => {
      dispatch({ type: ACTIONS.CLEAR_CART });
      showSuccess('Carrito vaciado');
    },
    
    addToWishlist: (product) => {
      const exists = state.wishlist.find(item => item.id === product.id);
      if (exists) {
        showError('El producto ya está en tu lista de deseos');
        return;
      }
      dispatch({ type: ACTIONS.ADD_TO_WISHLIST, payload: product });
      showSuccess(`${product.name} agregado a favoritos`);
    },
    
    removeFromWishlist: (productId) => {
      dispatch({ type: ACTIONS.REMOVE_FROM_WISHLIST, payload: productId });
      showSuccess('Producto removido de favoritos');
    },
    
    setSelectedCategory: (category) => {
      dispatch({ type: ACTIONS.SET_SELECTED_CATEGORY, payload: category });
    },
    
    setSearchTerm: (term) => {
      dispatch({ type: ACTIONS.SET_SEARCH_TERM, payload: term });
    },
    
    setCartOpen: (isOpen) => {
      dispatch({ type: ACTIONS.SET_CART_OPEN, payload: isOpen });
    }
  };

  // Funciones de cálculo
  const getters = {
    getCartCount: () => state.cart.reduce((count, item) => count + item.quantity, 0),
    getCartTotal: () => state.cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    getCartTotalFormatted: () => formatCurrencyWithSymbol(state.cart.reduce((total, item) => total + (item.price * item.quantity), 0)),
    isInWishlist: (productId) => state.wishlist.some(item => item.id === productId),
    getFilteredProducts: () => {
      return state.products.filter(product => {
        const matchesCategory = state.selectedCategory === 'Todos' || product.category === state.selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                             product.description.toLowerCase().includes(state.searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      });
    }
  };

  const value = {
    ...state,
    ...actions,
    ...getters
  };

  return (
    <EcommerceContext.Provider value={value}>
      {children}
    </EcommerceContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useEcommerce = () => {
  const context = useContext(EcommerceContext);
  if (!context) {
    throw new Error('useEcommerce debe ser usado dentro de un EcommerceProvider');
  }
  return context;
};

export default EcommerceContext; 