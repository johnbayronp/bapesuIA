import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PublicRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si el usuario está autenticado, mostrar mensaje y redirigir
  if (user) {
    // Mostrar mensaje de redirección por un momento
    if (!showRedirectMessage) {
      setShowRedirectMessage(true);
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/';
        window.location.href = from;
      }, 2000);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="animate-pulse">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ya has iniciado sesión
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Serás redirigido automáticamente...
              </p>
              <div className="mt-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default PublicRoute; 