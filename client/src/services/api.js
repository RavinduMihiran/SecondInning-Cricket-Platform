import axios from 'axios';

// Get token key from environment or use default
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'secondinning_token';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000', // Set the correct server address
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Check if it's an admin route
    if (config.url.includes('/api/admin')) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers['Authorization'] = `Bearer ${adminToken}`;
      }
    } else {
      // For regular user routes
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 