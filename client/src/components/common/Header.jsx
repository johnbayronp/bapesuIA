import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('access_token');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navLinkClass = (path) =>
    `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      location.pathname === path || location.pathname.startsWith(path + '/')
        ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
        : 'text-gray-600 dark:text-gray-400 hover:text-indigo-400 dark:hover:text-indigo-300 hover:bg-white/5'
    }`;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-[#07070f]/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(99,102,241,0.15)] dark:shadow-[0_1px_0_0_rgba(99,102,241,0.1)]'
          : 'bg-white/60 dark:bg-[#07070f]/60 backdrop-blur-md'
      }`}
    >
      {/* Gradient line at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-500/30 to-transparent" />

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={isDarkMode ? logoDark : logoLight}
            alt="BAPESU AI"
            className="h-8 w-auto transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
          />
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
        >
          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            {isMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>

        {/* Nav */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative top-16 md:top-0 left-0 w-full md:w-auto bg-white/95 dark:bg-[#0d0d1a]/95 backdrop-blur-xl md:backdrop-blur-none md:bg-transparent shadow-xl md:shadow-none border-b border-gray-100 dark:border-white/5 md:border-0`}>
          <div className="px-4 py-3 md:py-0 space-y-1 md:space-y-0 md:flex md:items-center md:space-x-1">

            <Link to="/tools" className={navLinkClass('/tools')} onClick={() => setIsMenuOpen(false)}>
              Herramientas IA
            </Link>

            <Link to="/studio" className={navLinkClass('/studio')} onClick={() => setIsMenuOpen(false)}>
              Studio
            </Link>

            <Link to="/colabora" className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              location.pathname === '/colabora'
                ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/60 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]'
            }`} onClick={() => setIsMenuOpen(false)}>
              ☕ Colabora
            </Link>

            {/* Auth section */}
            {user ? (
              <>
                {/* Mobile */}
                <div className="md:hidden border-t border-gray-100 dark:border-white/5 mt-2 pt-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      <div className="flex gap-3 mt-1">
                        <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-xs text-yellow-500 hover:text-yellow-400 font-semibold">Mi Panel</Link>
                        <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600">Perfil</Link>
                        <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-600">Salir</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_8px_rgba(99,102,241,0.35)]">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-indigo-400 transition-colors duration-200 max-w-[120px] truncate">{user.email}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl bg-white/95 dark:bg-[#0d0d1a]/95 backdrop-blur-xl border border-gray-100 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5 z-[60] overflow-hidden">
                      <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5 truncate">{user.email}</div>
                      <Link to="/dashboard" onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Mi Panel
                      </Link>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Mi Perfil
                      </Link>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Mobile */}
                <div className="md:hidden border-t border-gray-100 dark:border-white/5 mt-2 pt-2 px-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-semibold transition-all hover:opacity-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Iniciar sesión
                  </Link>
                </div>

                {/* Desktop */}
                <div className="hidden md:block ml-1">
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-[0_0_16px_rgba(99,102,241,0.4)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Iniciar sesión
                  </Link>
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
