import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get all achievements for a player
export const getPlayerAchievements = async (playerId, category = null, tier = null) => {
  try {
    let url = `${API_URL}/achievements/player/${playerId}`;
    
    // Add query parameters if provided
    if (category || tier) {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tier) params.append('tier', tier);
      url += `?${params.toString()}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching player achievements:', error);
    throw error;
  }
};

// Get achievement details by ID
export const getAchievementById = async (achievementId) => {
  try {
    const response = await axios.get(`${API_URL}/achievements/${achievementId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching achievement details:', error);
    throw error;
  }
};

// Get recent achievements for feed
export const getRecentAchievements = async (limit = 10) => {
  try {
    console.log(`Fetching recent achievements with limit: ${limit}`);
    const response = await axios.get(`${API_URL}/achievements/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent achievements:', error);
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid request');
    } else if (error.response?.status === 404) {
      throw new Error('Recent achievements not found');
    } else {
      throw new Error('Failed to fetch recent achievements. Please try again later.');
    }
  }
};

// Get achievement stats for a player
export const getPlayerAchievementStats = async (playerId) => {
  try {
    if (!playerId) {
      console.error('No player ID provided to getPlayerAchievementStats');
      throw new Error('Player ID is required');
    }
    
    console.log(`Fetching achievement stats for player ID: ${playerId}`);
    const response = await axios.get(`${API_URL}/achievements/stats/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching achievement stats:', error);
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid player ID format');
    } else if (error.response?.status === 404) {
      throw new Error('Player not found');
    } else {
      throw new Error('Failed to fetch achievement statistics. Please try again later.');
    }
  }
};

// Add a new achievement (admin/coach only)
export const addAchievement = async (achievementData, token) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.post(`${API_URL}/achievements`, achievementData, config);
    return response.data;
  } catch (error) {
    console.error('Error adding achievement:', error);
    throw error;
  }
};

// Submit an achievement for review (player)
export const submitAchievement = async (achievementData) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.post(`${API_URL}/achievements/submit`, achievementData, config);
    return response.data;
  } catch (error) {
    console.error('Error submitting achievement:', error);
    throw error;
  }
};

// Get pending achievements (admin/coach only)
export const getPendingAchievements = async (token) => {
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.get(`${API_URL}/achievements/pending`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending achievements:', error);
    throw error;
  }
};

// Review achievement (approve/reject) (admin/coach only)
export const reviewAchievement = async (achievementId, reviewData, token) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.put(`${API_URL}/achievements/${achievementId}/review`, reviewData, config);
    return response.data;
  } catch (error) {
    console.error('Error reviewing achievement:', error);
    throw error;
  }
};

// Update an achievement (admin/coach only)
export const updateAchievement = async (achievementId, achievementData, token) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.put(`${API_URL}/achievements/${achievementId}`, achievementData, config);
    return response.data;
  } catch (error) {
    console.error('Error updating achievement:', error);
    throw error;
  }
};

// Delete an achievement (admin only)
export const deleteAchievement = async (achievementId, token) => {
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.delete(`${API_URL}/achievements/${achievementId}`, config);
    return response.data;
  } catch (error) {
    console.error('Error deleting achievement:', error);
    throw error;
  }
}; 