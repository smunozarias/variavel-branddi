import { useState, useEffect, useCallback } from 'react';

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'variavel2024';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const sessionPassword = sessionStorage.getItem('variavel_auth');
    if (sessionPassword === APP_PASSWORD) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (password) => {
    setLoading(true);
    setError(null);
    
    try {
      if (password !== APP_PASSWORD) {
        throw new Error('Senha incorreta');
      }
      
      sessionStorage.setItem('variavel_auth', password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      sessionStorage.removeItem('variavel_auth');
      setIsAuthenticated(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao fazer logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated,
  };
}
