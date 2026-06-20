import { db } from '../api/db';

// Servicio de debug para diagnosticar problemas (usando UUID directamente)
export const userServiceDebug = {
  // Obtener el perfil del usuario sin RLS
  async getUserProfileDebug(userId) {
    try {
      console.log('🔍 [DEBUG] Intentando obtener perfil para:', userId);
      
      // Usar UUID directamente sin conversión
      console.log('🔍 [DEBUG] UUID del usuario:', userId);
      
      // Intentar obtener perfil directamente
      const { data, error } = await db
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [DEBUG] Error al obtener perfil:', error);
        throw error;
      }

      console.log('✅ [DEBUG] Perfil obtenido exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ [DEBUG] Error en getUserProfileDebug:', error);
      throw error;
    }
  },

  // Listar todos los usuarios (para debug)
  async getAllUsersDebug() {
    try {
      console.log('🔍 [DEBUG] Obteniendo todos los usuarios...');
      
      const { data, error } = await db
        .from('users')
        .select('*')
        .limit(10);

      if (error) {
        console.error('❌ [DEBUG] Error al obtener usuarios:', error);
        throw error;
      }

      console.log('✅ [DEBUG] Usuarios obtenidos:', data);
      return data;
    } catch (error) {
      console.error('❌ [DEBUG] Error en getAllUsersDebug:', error);
      throw error;
    }
  },

  // Verificar si un usuario existe
  async userExistsDebug(userId) {
    try {
      console.log('🔍 [DEBUG] Verificando si existe usuario:', userId);
      
      console.log('🔍 [DEBUG] UUID del usuario:', userId);
      
      const { data, error } = await db
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [DEBUG] Error al verificar usuario:', error);
        throw error;
      }

      const exists = !!data;
      console.log('✅ [DEBUG] Usuario existe:', exists);
      return exists;
    } catch (error) {
      console.error('❌ [DEBUG] Error en userExistsDebug:', error);
      return false;
    }
  },

  // Crear perfil de usuario (para debug)
  async createUserProfileDebug(userData) {
    try {
      console.log('🔍 [DEBUG] Intentando crear perfil para:', userData.id);
      
      console.log('🔍 [DEBUG] UUID del usuario:', userData.id);
      
      const { data, error } = await db
        .from('users')
        .insert([
          {
            id: userData.id,
            email: userData.email,
            created_at: userData.created_at,
            updated_at: new Date().toISOString(),
            first_name: null,
            last_name: null,
            phone: null,
            address: null,
            city: null,
            state: null,
            postal_code: null,
            country: null,
            is_active: true,
            role: 'customer',
            profile_image_url: null,
            preferences: {},
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
        console.error('❌ [DEBUG] Error al crear perfil:', error);
        throw error;
      }

      console.log('✅ [DEBUG] Perfil creado exitosamente:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ [DEBUG] Error en createUserProfileDebug:', error);
      throw error;
    }
  }
};
