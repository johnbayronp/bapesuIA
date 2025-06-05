import { useState, useCallback } from 'react';
import api from '../lib/axiosConfig';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api[method](url, data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Ha ocurrido un error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url) => request('get', url), [request]);
  const post = useCallback((url, data) => request('post', url, data), [request]);
  const put = useCallback((url, data) => request('put', url, data), [request]);
  const del = useCallback((url) => request('delete', url), [request]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
  };
}; 