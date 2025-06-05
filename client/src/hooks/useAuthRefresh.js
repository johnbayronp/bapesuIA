import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutos en milisegundos

export const useAuthRefresh = () => {
  useEffect(() => {
    const refreshToken = async () => {
      try {
        console.log('Iniciando proceso de refresco de token...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          return;
        }

        if (session) {
          console.log('Sesión encontrada, refrescando token...');
          // Refrescar el token
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Error al refrescar el token:', refreshError);
            return;
          }

          if (data.session) {
            // Actualizar el token en localStorage y sessionStorage
            localStorage.setItem('access_token', data.session.access_token);
            sessionStorage.setItem('access_token', data.session.access_token);
          }
        } else {
          console.log('No hay sesión activa para refrescar');
        }
      } catch (error) {
        console.error('Error en el proceso de refresco:', error);
      }
    };

    // Refrescar inmediatamente al montar el componente
    console.log('Refrescando token...');
    refreshToken();

    // Configurar el intervalo para refrescar cada 50 minutos
    const intervalId = setInterval(refreshToken, REFRESH_INTERVAL);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      console.log('Limpiando intervalo de refresco de token');
      clearInterval(intervalId);
    };
  }, []);
}; 