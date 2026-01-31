import api from './api';

/**
 * Fetch coaches with optional filtering
 * @param {Object} filters - Optional filters (district, search query)
 * @returns {Promise} - Promise that resolves to coaches data
 */
export const getCoaches = async (filters = {}) => {
  try {
    const { data } = await api.get('/api/network/coaches', { params: filters });
    return data;
  } catch (error) {
    console.error('Error fetching coaches:', error);
    throw error;
  }
};

/**
 * Fetch scouts with optional filtering
 * @param {Object} filters - Optional filters (district, search query)
 * @returns {Promise} - Promise that resolves to scouts data
 */
export const getScouts = async (filters = {}) => {
  try {
    const { data } = await api.get('/api/network/scouts', { params: filters });
    return data;
  } catch (error) {
    console.error('Error fetching scouts:', error);
    throw error;
  }
};

/**
 * Toggle favorite status for a coach
 * @param {string} coachId - Coach ID to toggle favorite status
 * @returns {Promise} - Promise that resolves to updated favorite status
 */
export const toggleFavoriteCoach = async (coachId) => {
  try {
    const { data } = await api.post(`/api/network/coaches/${coachId}/favorite`);
    return data;
  } catch (error) {
    console.error('Error toggling favorite coach:', error);
    throw error;
  }
};

/**
 * Request connection with a scout
 * @param {string} scoutId - Scout ID to request connection with
 * @returns {Promise} - Promise that resolves to connection request status
 */
export const requestScoutConnection = async (scoutId) => {
  try {
    const { data } = await api.post(`/api/network/scouts/${scoutId}/connect`);
    return data;
  } catch (error) {
    console.error('Error requesting scout connection:', error);
    throw error;
  }
};

/**
 * Get districts for filtering
 * @returns {Promise} - Promise that resolves to list of districts
 */
export const getDistricts = async () => {
  try {
    const { data } = await api.get('/api/network/districts');
    return data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

export default {
  getCoaches,
  getScouts,
  toggleFavoriteCoach,
  requestScoutConnection,
  getDistricts
}; 