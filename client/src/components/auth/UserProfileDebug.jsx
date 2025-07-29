import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { userServiceDebug } from '../../lib/userServiceDebug';

const UserProfileDebug = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (message) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    loadUserProfileDebug();
  }, []);

  const loadUserProfileDebug = async () => {
    try {
      setLoading(true);
      addDebugInfo('🔍 Iniciando carga de perfil de usuario...');
      
      // Obtener usuario actual
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addDebugInfo(`❌ Error al obtener usuario de auth: ${authError.message}`);
        return;
      }

      if (!currentUser) {
        addDebugInfo('❌ No hay usuario autenticado');
        return;
      }

      addDebugInfo(`✅ Usuario autenticado: ${currentUser.id} - ${currentUser.email}`);
      setUser(currentUser);

      // Probar obtener todos los usuarios primero
      addDebugInfo('🔍 Probando obtener todos los usuarios...');
      try {
        const allUsers = await userServiceDebug.getAllUsersDebug();
        addDebugInfo(`✅ Total usuarios en BD: ${allUsers.length}`);
      } catch (error) {
        addDebugInfo(`❌ Error al obtener todos los usuarios: ${error.message}`);
      }

      // Verificar si el usuario existe
      addDebugInfo('🔍 Verificando si el usuario existe...');
      try {
        const exists = await userServiceDebug.userExistsDebug(currentUser.id);
        addDebugInfo(`✅ Usuario existe en BD: ${exists}`);
      } catch (error) {
        addDebugInfo(`❌ Error al verificar usuario: ${error.message}`);
      }

      // Obtener perfil del usuario
      addDebugInfo('🔍 Obteniendo perfil de usuario...');
      try {
        const userProfile = await userServiceDebug.getUserProfileDebug(currentUser.id);
        addDebugInfo('✅ Perfil obtenido exitosamente');
        setProfile(userProfile);
      } catch (error) {
        addDebugInfo(`❌ Error al obtener perfil: ${error.message}`);
        
        // Intentar crear perfil si no existe
        addDebugInfo('🔍 Intentando crear perfil...');
        try {
          const newProfile = await userServiceDebug.createUserProfileDebug(currentUser);
          addDebugInfo('✅ Perfil creado exitosamente');
          setProfile(newProfile);
        } catch (createError) {
          addDebugInfo(`❌ Error al crear perfil: ${createError.message}`);
        }
      }

    } catch (error) {
      addDebugInfo(`❌ Error general: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando debug...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Debug - Perfil de Usuario
          </h1>
          <button
            onClick={loadUserProfileDebug}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Recargar Debug
          </button>
        </div>

        {/* Información del usuario */}
        {user && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Usuario Autenticado
            </h2>
            <p className="text-blue-800 dark:text-blue-300">ID: {user.id}</p>
            <p className="text-blue-800 dark:text-blue-300">Email: {user.email}</p>
            <p className="text-blue-800 dark:text-blue-300">Creado: {user.created_at}</p>
          </div>
        )}

        {/* Información del perfil */}
        {profile && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
              Perfil Encontrado
            </h2>
            <p className="text-green-800 dark:text-green-300">ID: {profile.id}</p>
            <p className="text-green-800 dark:text-green-300">Email: {profile.email}</p>
            <p className="text-green-800 dark:text-green-300">Nombre: {profile.first_name || 'No especificado'}</p>
            <p className="text-green-800 dark:text-green-300">Apellido: {profile.last_name || 'No especificado'}</p>
            <p className="text-green-800 dark:text-green-300">Rol: {profile.role}</p>
            <p className="text-green-800 dark:text-green-300">Activo: {profile.is_active ? 'Sí' : 'No'}</p>
          </div>
        )}

        {/* Logs de debug */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Logs de Debug
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg max-h-96 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-sm font-mono text-gray-800 dark:text-gray-200 mb-1">
                {info}
              </div>
            ))}
            {debugInfo.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400">
                No hay logs de debug disponibles
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-4">
          <button
            onClick={loadUserProfileDebug}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Ejecutar Debug Completo
          </button>
          <button
            onClick={() => setDebugInfo([])}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Limpiar Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileDebug;