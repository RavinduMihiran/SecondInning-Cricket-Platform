import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'secondinning_token';

// Register user
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    
    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      setAuthHeader(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      setAuthHeader(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  delete axios.defaults.headers.common['Authorization'];
};

// Get current user
export const getCurrentUser = async () => {
  try {
    // Check if we have a token
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }
    
    setAuthHeader(token);
    const response = await axios.get(`${API_URL}/auth/me`);
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await axios.put(`${API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Helper function to set auth header
export const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Setup axios interceptor for handling auth errors
export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // If unauthorized, log out user
      if (error.response?.status === 401) {
        logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

// Initialize auth from local storage
export const initAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    setAuthHeader(token);
    setupAxiosInterceptors();
    return true;
  }
  return false;
};

// Export authentication state check
export const isAuthenticated = () => {
  return localStorage.getItem(TOKEN_KEY) !== null;
};

// Export the service
const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  initAuth,
  changePassword
};

export default authService; 