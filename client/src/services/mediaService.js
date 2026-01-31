import axios from 'axios';

// Use the correct API URL that works with Vite's proxy configuration
const API_URL = '/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
    } else {
      console.warn('No token found in localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Get all media for the current user
export const getUserMedia = async () => {
  try {
    const response = await api.get('/media');
    return response.data;
  } catch (error) {
    console.error('Error fetching user media:', error);
    throw error;
  }
};

// Get public media for a specific player
export const getPlayerMedia = async (playerId) => {
  try {
    const response = await api.get(`/media/player/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player media:', error);
    throw error;
  }
};

// Get a specific media item by ID
export const getMediaById = async (mediaId) => {
  try {
    const response = await api.get(`/media/${mediaId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching media by ID:', error);
    throw error;
  }
};

// Get child's media (for parents)
export const getChildMedia = async (playerId) => {
  try {
    const response = await api.get(`/parents/media/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching child media:', error);
    throw error;
  }
};

// Upload new media
export const uploadMedia = async (formData) => {
  try {
    const response = await api.post('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Update media details
export const updateMedia = async (mediaId, updateData) => {
  try {
    const response = await api.put(`/media/${mediaId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating media:', error);
    throw error;
  }
};

// Delete media
export const deleteMedia = async (mediaId) => {
  try {
    const response = await api.delete(`/media/${mediaId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

const mediaService = {
  getUserMedia,
  getPlayerMedia,
  getMediaById,
  getChildMedia,
  uploadMedia,
  updateMedia,
  deleteMedia
};

export default mediaService; 