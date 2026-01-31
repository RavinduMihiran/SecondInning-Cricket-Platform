import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/admin/login', formData);
      
      // Store admin token in localStorage
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUser', JSON.stringify(response.data.user));
      
      toast.success('Admin login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="m-auto w-full max-w-md p-8 rounded-lg bg-gray-800 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-500">Admin Panel</h1>
          <p className="text-gray-400 mt-2">Cricket Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin username"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin password"
              required
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-medium text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Admin access only. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 