import axios from 'axios';
import { supabase } from './supabase';

const baseURL = import.meta.env.MODE === 'production' ? import.meta.env.VITE_API_URL : 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: baseURL || 'http://127.0.0.1:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    // Intentar obtener el token de sessionStorage primero
    let token = sessionStorage.getItem('access_token');
    
    // Si no está en sessionStorage, intentar obtenerlo de localStorage
    if (!token) {
      token = localStorage.getItem('access_token');
    }
    
    // Si aún no hay token, intentar obtenerlo de la sesión de Supabase
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
        // Guardar el token para futuras peticiones
        sessionStorage.setItem('access_token', token);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('access_token');
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 