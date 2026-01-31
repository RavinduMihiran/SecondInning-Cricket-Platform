import api from './axiosConfig';

// Get parent dashboard data
export const getParentDashboardData = async () => {
  try {
    const response = await api.get('/parents/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching parent dashboard data:', error);
    throw error;
  }
};

// Get parent's children (players)
export const getChildren = async () => {
  try {
    const response = await api.get('/parents/children');
    return response.data;
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
};

// Get specific child's details
export const getChildDetails = async (playerId) => {
  try {
    const response = await api.get(`/parents/children/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching child details:', error);
    throw error;
  }
};

// Link parent to player using access code
export const linkPlayer = async (accessCode, relationship) => {
  try {
    const response = await api.post('/parents/link-player', { accessCode, relationship });
    return response.data;
  } catch (error) {
    console.error('Error linking player:', error);
    throw error;
  }
};

// Generate access code for parent (Player generates this)
export const generateAccessCode = async () => {
  try {
    console.log('Calling generate-access-code endpoint...');
    const response = await api.post('/parents/generate-access-code');
    console.log('Access code generated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating access code:', error);
    
    // Log more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

// Get coach feedback for a specific player
export const getCoachFeedback = async (playerId) => {
  try {
    const response = await api.get(`/parents/feedback/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching coach feedback:', error);
    throw error;
  }
};

// Get match stats for a specific player
export const getPlayerStats = async (playerId) => {
  try {
    const response = await api.get(`/parents/stats/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }
};

// Create parent engagement (reaction, comment, sticker)
export const createEngagement = async (engagementData) => {
  try {
    console.log('Sending engagement request to server:', engagementData);
    
    // Ensure we don't send undefined contentId for general type
    if (engagementData.contentType === 'general' && !engagementData.contentId) {
      delete engagementData.contentId;
    }
    
    const response = await api.post('/parents/engagement', engagementData);
    console.log('Server response for engagement:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating engagement:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

// Get parent engagements for a specific player
export const getEngagements = async (playerId) => {
  try {
    const response = await api.get(`/parents/engagements/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching engagements:', error);
    throw error;
  }
};

const parentService = {
  getParentDashboardData,
  getChildren,
  getChildDetails,
  linkPlayer,
  generateAccessCode,
  getCoachFeedback,
  getPlayerStats,
  createEngagement,
  getEngagements
};

export default parentService; 