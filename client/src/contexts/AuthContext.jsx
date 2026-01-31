import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user data when token is available
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`);
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error loading user', error);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        email,
        password
      });
      
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return res.data;
    } catch (error) {
      console.error('Login error', error);
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, userData);
      toast.success('Registration successful! Please login.');
      return res.data;
    } catch (error) {
      console.error('Registration error', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.info('You have been logged out');
  };

  // Update user profile in context
  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 