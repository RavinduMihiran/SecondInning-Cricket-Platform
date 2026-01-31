import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      
      // Add more detailed error information to the error object
      error.detailedMessage = error.response.data.message || 'Server error occurred';
      error.statusCode = error.response.status;
      
      // Handle specific error codes
      if (error.response.status === 500) {
        console.error('Server error details:', error.response.data.error || 'No additional details');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      error.detailedMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      error.detailedMessage = 'Request configuration error: ' + error.message;
    }
    
    return Promise.reject(error);
  }
);

export default api; 