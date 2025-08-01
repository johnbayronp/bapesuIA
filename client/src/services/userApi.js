import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class UserApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * Obtener el token de autenticación
     */
    async getAuthToken() {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token;
    }

    /**
     * Realizar una petición HTTP con autenticación
     */
    async makeRequest(endpoint, options = {}) {
        const token = await this.getAuthToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        };

        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Obtener lista de usuarios con paginación y filtros
     */
    async getUsers(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.per_page) queryParams.append('per_page', params.per_page);
        if (params.status) queryParams.append('status', params.status);
        if (params.role) queryParams.append('role', params.role);
        if (params.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString();
        const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
        
        return this.makeRequest(endpoint);
    }

    /**
     * Obtener un usuario por ID
     */
    async getUserById(userId) {
        return this.makeRequest(`/users/${userId}`);
    }

    /**
     * Crear un nuevo usuario
     */
    async createUser(userData) {
        return this.makeRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Actualizar un usuario
     */
    async updateUser(userId, userData) {
        return this.makeRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Eliminar un usuario
     */
    async deleteUser(userId) {
        return this.makeRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Desactivar un usuario
     */
    async deactivateUser(userId) {
        return this.makeRequest(`/users/${userId}/deactivate`, {
            method: 'PATCH'
        });
    }

    /**
     * Activar un usuario
     */
    async activateUser(userId) {
        return this.makeRequest(`/users/${userId}/activate`, {
            method: 'PATCH'
        });
    }

    /**
     * Obtener estadísticas de usuarios
     */
    async getUserStats() {
        return this.makeRequest('/users/stats');
    }
}

export default new UserApiService(); 