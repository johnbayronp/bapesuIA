import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { userService } from '../../lib/userService';
import useToast from '../../hooks/useToast';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useToast();

  // Formulario de edición
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    newsletter_subscription: false,
    marketing_consent: false
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Iniciando carga de perfil de usuario...');
      
      // Obtener usuario actual
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Error al obtener usuario de auth:', authError);
        setError('Error al obtener datos del usuario autenticado');
        showError('Error de autenticación');
        return;
      }

      if (!currentUser) {
        console.error('❌ No hay usuario autenticado');
        setError('No hay usuario autenticado');
        showError('Debes iniciar sesión para ver tu perfil');
        return;
      }

      console.log('✅ Usuario autenticado:', currentUser.id, currentUser.email);
      setUser(currentUser);

      // Obtener perfil del usuario
      console.log('🔍 Obteniendo perfil de usuario...');
      const userProfile = await userService.getUserProfile(currentUser.id);
      
      console.log('✅ Perfil obtenido:', userProfile);
      setProfile(userProfile);
      
      // Llenar formulario con datos existentes
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        postal_code: userProfile.postal_code || '',
        country: userProfile.country || '',
        newsletter_subscription: userProfile.newsletter_subscription || false,
        marketing_consent: userProfile.marketing_consent || false
      });

      // Verificar si el perfil está completo
      const isProfileComplete = checkProfileCompleteness(userProfile);
      console.log('📊 Perfil completo:', isProfileComplete);
      
      if (!isProfileComplete) {
        console.log('⚠️ Perfil incompleto, mostrando formulario de completar');
        setIsCompletingProfile(true);
      }

    } catch (error) {
      console.error('❌ Error al cargar perfil:', error);
      setError(error.message || 'Error al cargar el perfil del usuario');
      showError('Error al cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si el perfil está completo
  const checkProfileCompleteness = (profile) => {
    if (!profile) return false;
    
    return profile.first_name && 
           profile.last_name && 
           profile.phone && 
           profile.address && 
           profile.city && 
           profile.state && 
           profile.postal_code && 
           profile.country;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Guardando cambios en perfil...');
      
      const updatedProfile = await userService.updateUserProfile(user.id, formData);
      console.log('✅ Perfil actualizado:', updatedProfile);
      
      setProfile(updatedProfile);
      setIsEditing(false);
      setIsCompletingProfile(false);
      showSuccess('Perfil actualizado correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      showError('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteProfile = async () => {
    try {
      setSaving(true);
      console.log('✅ Completando perfil de usuario...');
      
      const updatedProfile = await userService.updateUserProfile(user.id, formData);
      console.log('✅ Perfil completado:', updatedProfile);
      
      setProfile(updatedProfile);
      setIsCompletingProfile(false);
      showSuccess('¡Perfil completado exitosamente!');
    } catch (error) {
      console.error('❌ Error al completar perfil:', error);
      showError('Error al completar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar datos originales
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        country: profile.country || '',
        newsletter_subscription: profile.newsletter_subscription || false,
        marketing_consent: profile.marketing_consent || false
      });
    }
    setIsEditing(false);
    setIsCompletingProfile(false);
  };

  // Mostrar error si existe
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error al cargar el perfil
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadUserProfile}
                  className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si el perfil no está completo, mostrar formulario de completar registro
  if (isCompletingProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Completa tu registro!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Para una mejor experiencia, completa algunos datos opcionales de tu perfil. 
              Esto nos ayudará a personalizar tu experiencia en la tienda.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleCompleteProfile(); }} className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apellido <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tu apellido"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tu teléfono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                    {profile?.email || user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dirección de Envío <span className="text-gray-500 text-sm">(opcional)</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tu dirección completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado/Provincia
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Estado/Provincia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Código postal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="País"
                  />
                </div>
              </div>
            </div>

            {/* Preferencias */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferencias <span className="text-gray-500 text-sm">(opcional)</span></h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="newsletter_subscription"
                    checked={formData.newsletter_subscription}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Suscribirse al boletín de noticias
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="marketing_consent"
                    checked={formData.marketing_consent}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Recibir ofertas y promociones por email
                  </label>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Completar más tarde
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-md transition-colors"
              >
                {saving ? 'Guardando...' : 'Completar Registro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Si no hay perfil, mostrar mensaje de error
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                No se pudo cargar el perfil
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>No se encontró información del perfil. Intenta recargar la página.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadUserProfile}
                  className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200 dark:hover:bg-yellow-700"
                >
                  Recargar perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Editar Perfil
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tu nombre"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profile.first_name || 'No especificado'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apellido
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tu apellido"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profile.last_name || 'No especificado'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{profile.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tu teléfono"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profile.phone || 'No especificado'}</p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dirección de Envío</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tu dirección completa"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profile.address || 'No especificada'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ciudad
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ciudad"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profile.city || 'No especificada'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado/Provincia
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Estado/Provincia"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profile.state || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código Postal
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Código postal"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profile.postal_code || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  País
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="País"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profile.country || 'No especificado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preferencias */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferencias</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="newsletter_subscription"
                  checked={formData.newsletter_subscription}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Suscribirse al boletín de noticias
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="marketing_consent"
                  checked={formData.marketing_consent}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Recibir ofertas y promociones por email
                </label>
              </div>
            </div>
          </div>

          {/* Estadísticas de la tienda */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estadísticas de la Tienda</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Gastado</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  ${profile.total_spent || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Puntos de Fidelidad</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {profile.loyalty_points || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos Realizados</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {profile.order_history ? profile.order_history.length : 0}
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          {isEditing && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;