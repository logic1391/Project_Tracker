import { useState, useEffect } from 'react';
import api, { AUTH_EXPIRED_EVENT } from '../services/api';
import { AuthContext } from './auth-context';

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return storedUser && token ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Restore the session synchronously from localStorage
  const [user, setUser] = useState(readStoredUser);
  const loading = false;

  // Re-read the current user so role changes made by an Admin take effect
  // without signing out and in again. A 401 is handled by the interceptor.
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    let ignore = false;
    api.get('/auth/me')
      .then(({ data }) => {
        if (ignore || !data?.user) return;
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(prev => (prev && prev.role === data.user.role && prev.name === data.user.name ? prev : data.user));
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  // Log out automatically when the API reports an expired/invalid token
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || (error.response ? 'Login failed' : 'Cannot reach the server. Check your connection and try again.')
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return { success: true, user: response.data.user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || (error.response ? 'Registration failed' : 'Cannot reach the server. Check your connection and try again.')
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
