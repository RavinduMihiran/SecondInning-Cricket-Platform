import api from './axiosConfig';

// Get coach dashboard data
export const getCoachDashboardData = async () => {
  try {
    const response = await api.get('/coaches/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching coach dashboard data:', error);
    throw error;
  }
};

// Search players
export const searchPlayers = async (searchParams) => {
  try {
    // Build the URL with search parameters
    let url = '/coaches/players/search?';
    
    // Add search params to URL
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] !== undefined && searchParams[key] !== '') {
        url += `${key}=${encodeURIComponent(searchParams[key])}&`;
      }
    });
    
    // Log the request
    console.log('Searching players with URL:', url);
    console.log('Search parameters:', searchParams);
    
    // Make the API request
    const response = await api.get(url);
    
    // Log success
    console.log('Search successful, found players:', response.data.players?.length || 0);
    
    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error('Error searching players:', error);
    
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    // Enhanced error handling
    if (error.detailedMessage) {
      console.error('Detailed error:', error.detailedMessage);
    }
    
    // Rethrow for component to handle
    throw error;
  }
};

// Get player details
export const getPlayerDetails = async (playerId) => {
  try {
    console.log('Calling API to get player details for ID:', playerId);
    const response = await api.get(`/coaches/players/${playerId}`);
    console.log('API response for player details:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching player details:', error);
    throw error;
  }
};

// Rate player
export const ratePlayer = async (playerId, ratingData) => {
  try {
    const response = await api.post(`/coaches/players/${playerId}/rate`, ratingData);
    return response.data;
  } catch (error) {
    console.error('Error rating player:', error);
    throw error;
  }
};

// Get watchlist
export const getWatchlist = async () => {
  try {
    const response = await api.get('/coaches/watchlist');
    return response.data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
};

// Add player to watchlist
export const addToWatchlist = async (playerId, notes = '') => {
  try {
    const response = await api.post(`/coaches/watchlist/add/${playerId}`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error adding player to watchlist:', error);
    throw error;
  }
};

// Remove player from watchlist
export const removeFromWatchlist = async (playerId) => {
  try {
    const response = await api.delete(`/coaches/watchlist/remove/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing player from watchlist:', error);
    throw error;
  }
};

// Compare players
export const comparePlayers = async (playerIds) => {
  try {
    // Ensure playerIds is an array
    if (!Array.isArray(playerIds)) {
      playerIds = [playerIds];
    }
    
    // Filter out any empty or undefined values
    playerIds = playerIds.filter(id => id);
    
    if (playerIds.length === 0) {
      throw new Error('No valid player IDs provided');
    }

    // Use axios's params object with paramsSerializer for proper array handling
    const response = await api.get('/coaches/compare', {
      params: { players: playerIds },
      // This ensures arrays are properly serialized as multiple parameters with the same name
      paramsSerializer: {
        indexes: null // This will generate players=id1&players=id2 format
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error comparing players:', error);
    throw error;
  }
};

// Export watchlist
export const exportWatchlist = async () => {
  try {
    const response = await api.get('/coaches/export/watchlist');
    return response.data;
  } catch (error) {
    console.error('Error exporting watchlist:', error);
    throw error;
  }
};

// Send feedback to player
export const sendPlayerFeedback = async (playerId, feedbackData) => {
  try {
    const response = await api.post(`/coaches/players/${playerId}/feedback`, feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error sending player feedback:', error);
    throw error;
  }
};

// Get feedback history for a player
export const getPlayerFeedbackHistory = async (playerId) => {
  try {
    const response = await api.get(`/coaches/players/${playerId}/feedback`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player feedback history:', error);
    throw error;
  }
};

// Get coach profile
export const getCoachProfile = async () => {
  try {
    const response = await api.get('/coaches/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching coach profile:', error);
    throw error;
  }
};

// Update coach profile
export const updateCoachProfile = async (profileData) => {
  try {
    console.log('coachService: Sending profile data to server:', profileData);
    if (profileData.dateOfBirth) {
      console.log('coachService: dateOfBirth being sent:', profileData.dateOfBirth);
    }
    
    const response = await api.put('/coaches/me', profileData);
    console.log('coachService: Server response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error updating coach profile:', error);
    throw error;
  }
};

// Update coach profile image (base64)
export const updateCoachProfileImage = async (imageData) => {
  try {
    const response = await api.put('/coaches/me/profile-image', { 
      imageUrl: imageData 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating coach profile image:', error);
    throw error;
  }
};

// Upload coach profile image using FormData (file upload)
export const uploadCoachProfileImage = async (imageFile) => {
  try {
    console.log('Starting profile image upload, file:', imageFile.name, 'size:', imageFile.size);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    console.log('FormData created, sending request...');
    
    const response = await api.post('/coaches/me/profile-image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Image upload successful, response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading coach profile image:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

const coachService = {
  getCoachDashboardData,
  searchPlayers,
  getPlayerDetails,
  ratePlayer,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  comparePlayers,
  exportWatchlist,
  sendPlayerFeedback,
  getPlayerFeedbackHistory,
  getCoachProfile,
  updateCoachProfile,
  updateCoachProfileImage,
  uploadCoachProfileImage
};

export default coachService; 