import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { userService } from '../../lib/userService';
import useToast from '../../hooks/useToast';
import UserOrders from './UserOrders';
import { formatCurrencyWithSymbol } from '../../utils/currencyFormatter';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
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

  // Función auxiliar para obtener estadísticas de órdenes
  const getOrderStats = async () => {
    const token = localStorage.getItem('access_token');
    const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/user/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    let orderStats = {
      total_spent: 0,
      loyalty_points: 0,
      order_history: []
    };
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      if (statsData.success) {
        orderStats = statsData.data;
      }
    }
    
    return orderStats;
  };

  // Función auxiliar para combinar perfil con estadísticas
  const combineProfileWithStats = (userProfile, orderStats) => {
    return {
      ...userProfile,
      total_spent: orderStats.total_spent,
      loyalty_points: orderStats.loyalty_points,
      order_history: orderStats.order_history
    };
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener usuario actual
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError('Error al obtener datos del usuario autenticado');
        showError('Error de autenticación');
        return;
      }

      if (!currentUser) {
        setError('No hay usuario autenticado');
        showError('Debes iniciar sesión para ver tu perfil');
        return;
      }

      setUser(currentUser);

      // Obtener perfil del usuario
      const userProfile = await userService.getUserProfile(currentUser.id);
      
      // Obtener estadísticas de órdenes
      const orderStats = await getOrderStats();
      
      // Combinar perfil con estadísticas de órdenes
      const profileWithStats = combineProfileWithStats(userProfile, orderStats);
      
      setProfile(profileWithStats);
      
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

      // Verificar si el perfil está completo (solo verificar campos básicos)
      const isProfileComplete = checkProfileCompleteness(userProfile);
      
      if (!isProfileComplete) {
        setIsCompletingProfile(true);
      }

    } catch (error) {
      setError(error.message || 'Error al cargar el perfil del usuario');
      showError('Error al cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si el perfil está completo (solo campos básicos)
  const checkProfileCompleteness = (profile) => {
    if (!profile) return false;
    
    // Solo verificar campos básicos, no todos los campos opcionales
    return profile.first_name && profile.last_name;
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
      
      const updatedProfile = await userService.updateUserProfile(user.id, formData);
      
      // Obtener estadísticas de órdenes para mantenerlas
      const orderStats = await getOrderStats();
      
      // Combinar perfil actualizado con estadísticas de órdenes
      const profileWithStats = combineProfileWithStats(updatedProfile, orderStats);
      
      setProfile(profileWithStats);
      setIsEditing(false);
      setIsCompletingProfile(false);
      showSuccess('Perfil actualizado correctamente');
    } catch (error) {
      showError('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteProfile = async () => {
    try {
      setSaving(true);
      
      const updatedProfile = await userService.updateUserProfile(user.id, formData);
      
      // Obtener estadísticas de órdenes para mantenerlas
      const orderStats = await getOrderStats();
      
      // Combinar perfil actualizado con estadísticas de órdenes
      const profileWithStats = combineProfileWithStats(updatedProfile, orderStats);
      
      setProfile(profileWithStats);
      setIsCompletingProfile(false);
      showSuccess('¡Perfil completado exitosamente!');
    } catch (error) {
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
          {!isEditing && activeTab === 'profile' && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Editar Perfil
            </button>
          )}
        </div>

        {/* Pestañas */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Mis Pedidos
            </button>
          </nav>
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-6">
            {/* Estadísticas de la tienda - PRIMERAS */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Estadísticas de la Tienda</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Gastado */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-80">Total Gastado</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {formatCurrencyWithSymbol(profile.total_spent || 0)}
                  </div>
                  <div className="text-xs opacity-80">
                    En compras realizadas
                  </div>
                </div>
              </div>

              {/* Puntos de Fidelidad */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-12 h-12 bg-white/5 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-80">Puntos</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {profile.loyalty_points || 0}
                  </div>
                  <div className="text-xs opacity-80">
                    De fidelidad acumulados
                  </div>
                </div>
              </div>

              {/* Pedidos Realizados */}
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-white/10 rounded-full"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white/5 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-80">Pedidos</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {profile.order_history ? profile.order_history.length : 0}
                  </div>
                  <div className="text-xs opacity-80">
                    Realizados en total
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Estado de Cliente</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.loyalty_points >= 100 ? 'Cliente VIP' : 
                       profile.loyalty_points >= 50 ? 'Cliente Frecuente' : 
                       profile.loyalty_points >= 10 ? 'Cliente Regular' : 'Cliente Nuevo'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Última Compra</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.order_history && profile.order_history.length > 0 
                        ? new Date(profile.order_history[0].created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Aún no has realizado compras'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* Preferencias - MEJORADAS */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferencias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Newsletter */}
              <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.newsletter_subscription 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    formData.newsletter_subscription 
                      ? 'bg-indigo-100 dark:bg-indigo-800' 
                      : 'bg-gray-100 dark:bg-gray-600'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      formData.newsletter_subscription 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Boletín de Noticias</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recibe actualizaciones y novedades</p>
                  </div>
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      name="newsletter_subscription"
                      checked={formData.newsletter_subscription}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Marketing */}
              <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.marketing_consent 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    formData.marketing_consent 
                      ? 'bg-green-100 dark:bg-green-800' 
                      : 'bg-gray-100 dark:bg-gray-600'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      formData.marketing_consent 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Ofertas y Promociones</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Descuentos exclusivos por email</p>
                  </div>
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      name="marketing_consent"
                      checked={formData.marketing_consent}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors"
                    />
                  </div>
                </div>
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
      ) : (
        <UserOrders />
      )}
      </div>
    </div>
  );
};

export default UserProfile;