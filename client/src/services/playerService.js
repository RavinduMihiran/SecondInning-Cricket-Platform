import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Get current player's profile
export const getCurrentPlayerProfile = async () => {
  try {
    const response = await api.get('/players/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current player profile:', error);
    throw error;
  }
};

// Get player profile by ID
export const getPlayerProfile = async (playerId) => {
  try {
    const response = await api.get(`/players/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    throw error;
  }
};

// Get current player's detailed stats
export const getPlayerDetailedStats = async () => {
  try {
    const response = await api.get('/players/me/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching player detailed stats:', error);
    throw error;
  }
};

// Update player profile
export const updatePlayerProfile = async (profileData) => {
  try {
    const response = await api.put('/players/me', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating player profile:', error);
    throw error;
  }
};

// Update player profile image (base64)
export const updateProfileImage = async (imageData) => {
  try {
    const response = await api.put('/players/me/profile-image', { 
      imageUrl: imageData 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
};

// Upload profile image using FormData (file upload)
export const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/players/me/profile-image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

// Search players
export const searchPlayers = async (searchParams) => {
  try {
    const { query, school, district } = searchParams;
    let url = `/players/search?`;
    
    if (query) url += `query=${encodeURIComponent(query)}&`;
    if (school) url += `school=${encodeURIComponent(school)}&`;
    if (district) url += `district=${encodeURIComponent(district)}&`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error searching players:', error);
    throw error;
  }
};

// Get player feedback
export const getPlayerFeedback = async () => {
  try {
    const response = await api.get('/players/me/feedback');
    return response.data;
  } catch (error) {
    console.error('Error fetching player feedback:', error);
    throw error;
  }
};

// Mark feedback as read
export const markFeedbackAsRead = async (feedbackId) => {
  try {
    // Check if feedbackId is valid
    if (!feedbackId) {
      console.warn('Invalid feedback ID provided to markFeedbackAsRead');
      return { success: false, message: 'Invalid feedback ID' };
    }
    
    const response = await api.put(`/players/me/feedback/${feedbackId}/read`);
    return response.data;
  } catch (error) {
    // Handle 403 Forbidden errors more gracefully
    if (error.response && error.response.status === 403) {
      console.warn(`Permission denied for feedback ${feedbackId}:`, error.response.data.message || 'Unauthorized access');
      return { success: false, message: 'Permission denied' };
    }
    
    console.error('Error marking feedback as read:', error);
    throw error;
  }
};

// Get unread feedback count
export const getUnreadFeedbackCount = async () => {
  try {
    const response = await api.get('/players/me/feedback/unread');
    return response.data;
  } catch (error) {
    console.error('Error fetching unread feedback count:', error);
    throw error;
  }
};

// Get player ratings
export const getPlayerRatings = async () => {
  try {
    const response = await api.get('/players/me/ratings');
    return response.data;
  } catch (error) {
    console.error('Error fetching player ratings:', error);
    throw error;
  }
};

// Get unread parent engagements
export const getUnreadParentEngagements = async () => {
  try {
    const response = await api.get('/players/engagements/unread');
    return response.data;
  } catch (error) {
    console.error('Error fetching unread parent engagements:', error);
    throw error;
  }
};

// Mark parent engagements as read
export const markParentEngagementsAsRead = async (engagementIds = null) => {
  try {
    const response = await api.post('/players/engagements/mark-read', { 
      engagementIds 
    });
    return response.data;
  } catch (error) {
    console.error('Error marking parent engagements as read:', error);
    throw error;
  }
};

const playerService = {
  getCurrentPlayerProfile,
  getPlayerProfile,
  getPlayerDetailedStats,
  updatePlayerProfile,
  updateProfileImage,
  uploadProfileImage,
  searchPlayers,
  getPlayerFeedback,
  markFeedbackAsRead,
  getUnreadFeedbackCount,
  getPlayerRatings,
  getUnreadParentEngagements,
  markParentEngagementsAsRead
};

export default playerService; 