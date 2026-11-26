import axios from 'axios';

// Fired when the server rejects our token so the app can log the user out
export const AUTH_EXPIRED_EVENT = 'auth:expired';

const api = axios.create({
  baseURL: import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5001/api',
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Clear the session when the token is missing, invalid or expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
