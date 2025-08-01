import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import CartIcon from './CartIcon';
import { useEcommerce } from '../../context/EcommerceContext';
import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartCount, setCartOpen } = useEcommerce();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log(user);
      setUser(user);
      
      // Verificar si es admin solo si hay usuario
      if (user) {
        checkAdminStatus(user.id);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Detectar modo oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Verificar inicialmente
    checkDarkMode();

    // Observar cambios en el tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Cerrar menú de usuario cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const checkAdminStatus = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && profile?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Limpiar los tokens al cerrar sesión
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('access_token');
      setUser(null);
      setIsAdmin(false);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md transition-colors duration-300 relative z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        <Link to="/" className="flex items-center">
          <img 
            src={isDarkMode ? logoDark : logoLight} 
            alt="BAPESU AI Tools" 
            className="h-8 w-auto"
          />
        </Link>

        {/* Menú hamburguesa para móvil */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Menú de navegación */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative top-16 md:top-0 left-0 w-full md:w-auto bg-white dark:bg-gray-800 shadow-lg md:shadow-none`}>
          <div className="px-2 pt-2 pb-3 space-y-1 md:space-y-0 md:flex md:items-center md:space-x-4">
            {/* Tienda - Primero */}
            <Link 
              to="/tienda" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                location.pathname === '/tienda' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Tienda
            </Link>
            
            {/* Herramientas IA */}
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                location.pathname === '/' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Herramientas IA
            </Link>
            
            {/* Botón del carrito */}
            <button 
              className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 relative text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                if (location.pathname === '/tienda') {
                  setCartOpen(true);
                } else {
                  navigate('/tienda');
                }
              }}
            >
              <CartIcon />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {getCartCount() > 99 ? '99+' : getCartCount()}
                </span>
              )}
            </button>
            
            {/* Administrador - solo si es admin */}
            {user && isAdmin && (
              <Link 
                to="/admin" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  location.pathname === '/admin' 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Administrador
              </Link>
            )}
            
            {/* Usuario autenticado */}
            {user ? (
              <>
                {/* Versión móvil */}
                <div className="md:hidden border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                      <div className="flex flex-col space-y-1 mt-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          Mi Perfil
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Versión escritorio */}
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
                  </button>
                  
                  {/* Menú desplegable del usuario */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-[60]">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                          {user.email}
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          role="menuitem"
                        >
                          Mi Perfil
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 cursor-pointer"
                          role="menuitem"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Usuario no autenticado */
              <>
                {/* Versión móvil */}
                <div className="md:hidden border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900"
                  >
                    Iniciar sesión
                  </button>
                </div>

                {/* Versión escritorio */}
                <div className="hidden md:block">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-md text-base font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors duration-200"
                  >
                    Iniciar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header; 