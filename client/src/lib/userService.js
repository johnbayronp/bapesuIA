import { supabase } from './supabase';

// Servicio para manejar la tabla de usuarios (ahora usando UUID directamente)
export const userService = {
  // Crear un nuevo registro de usuario en la tabla users
  async createUserProfile(userData) {
    try {
      console.log('Intentando crear perfil para usuario:', userData.id);
      
      // Ya no necesitamos conversión, usamos el UUID directamente
      const userId = userData.id;
      console.log('UUID del usuario:', userId);
      
      // Primero verificar si el usuario ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error al verificar usuario existente:', checkError);
      }

      if (existingUser) {
        console.log('Usuario ya existe en la tabla users');
        return existingUser;
      }

      // Crear nuevo perfil
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: userData.email,
            created_at: userData.created_at,
            updated_at: new Date().toISOString(),
            // Campos específicos para tienda virtual
            first_name: null,
            last_name: null,
            phone: null,
            address: null,
            city: null,
            state: null,
            postal_code: null,
            country: null,
            is_active: true,
            role: 'customer', // customer, admin, vendor
            profile_image_url: null,
            preferences: {},
            // Campos de tienda virtual
            wishlist: [],
            cart_items: [],
            order_history: [],
            total_spent: 0,
            loyalty_points: 0,
            newsletter_subscription: false,
            marketing_consent: false
          }
        ])
        .select();

      if (error) {
        console.error('Error al crear perfil de usuario:', error);
        throw error;
      }

      console.log('Perfil de usuario creado exitosamente:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Error en createUserProfile:', error);
      throw error;
    }
  },

  // Obtener el perfil completo del usuario (crea perfil si no existe)
  async getUserProfile(userId) {
    try {
      // Usar UUID directamente sin conversión
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Usuario no existe en public.users, crear perfil automáticamente
          console.log('Usuario no tiene perfil, creando automáticamente...');
          
          // Obtener datos del usuario desde auth.users
          const { data: authUser, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            console.error('Error al obtener datos de auth:', authError);
            throw authError;
          }
          
          // Crear perfil automáticamente
          return await this.createUserProfile(authUser.user);
        } else {
          console.error('Error al obtener perfil de usuario:', error);
          throw error;
        }
      }

      return data;
    } catch (error) {
      console.error('Error en getUserProfile:', error);
      throw error;
    }
  },

  // Obtener o crear perfil de usuario (función de conveniencia)
  async getOrCreateUserProfile(userId) {
    try {
      return await this.getUserProfile(userId);
    } catch (error) {
      console.error('Error en getOrCreateUserProfile:', error);
      throw error;
    }
  },

  // Actualizar el perfil del usuario
  async updateUserProfile(userId, updates) {
    try {
      // Usar UUID directamente sin conversión
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Error al actualizar perfil de usuario:', error);
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error('Error en updateUserProfile:', error);
      throw error;
    }
  },

  // Eliminar perfil de usuario (soft delete)
  async deactivateUser(userId) {
    try {
      // Usar UUID directamente sin conversión
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Error al desactivar usuario:', error);
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error('Error en deactivateUser:', error);
      throw error;
    }
  },

  // Obtener todos los usuarios (para admin)
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      throw error;
    }
  },

  // Verificar si un usuario existe
  async userExists(userId) {
    try {
      // Usar UUID directamente sin conversión
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error al verificar si usuario existe:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error en userExists:', error);
      return false;
    }
  },

  // Obtener estadísticas de órdenes del usuario
  async getUserOrderStats(userId) {
    try {
      // Obtener todas las órdenes del usuario
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener órdenes del usuario:', error);
        throw error;
      }

      // Calcular estadísticas
      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const totalOrders = orders.length;
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      
      // Calcular puntos de fidelidad (1 punto por cada $10.000 gastados)
      const loyaltyPoints = Math.floor(totalSpent / 10000);

      return {
        total_spent: totalSpent,
        total_orders: totalOrders,
        delivered_orders: deliveredOrders,
        loyalty_points: loyaltyPoints,
        order_history: orders
      };
    } catch (error) {
      console.error('Error en getUserOrderStats:', error);
      return {
        total_spent: 0,
        total_orders: 0,
        delivered_orders: 0,
        loyalty_points: 0,
        order_history: []
      };
    }
  }
};

// Hook para manejar la creación automática de perfiles de usuario
export const useUserProfile = () => {
  const createProfileOnSignUp = async (user) => {
    try {
      console.log('Iniciando creación automática de perfil para:', user.id);
      
      // Verificar si el usuario ya tiene un perfil
      const existingProfile = await userService.getUserProfile(user.id);
      if (existingProfile) {
        console.log('Perfil ya existe, retornando:', existingProfile);
        return existingProfile;
      }

      // Crear nuevo perfil si no existe
      const newProfile = await userService.createUserProfile(user);
      console.log('Perfil de usuario creado automáticamente:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error al crear perfil automáticamente:', error);
      throw error;
    }
  };

  const getOrCreateProfile = async (userId) => {
    try {
      return await userService.getOrCreateUserProfile(userId);
    } catch (error) {
      console.error('Error en getOrCreateProfile:', error);
      throw error;
    }
  };

  return { createProfileOnSignUp, getOrCreateProfile };
};