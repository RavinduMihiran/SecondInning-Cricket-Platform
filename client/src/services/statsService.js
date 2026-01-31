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

// Get stats summary
export const getStatsSummary = async () => {
  try {
    const response = await api.get('/stats/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    throw error;
  }
};

// Get detailed cricket stats
export const getDetailedStats = async () => {
  try {
    const response = await api.get('/stats/detailed');
    return response.data;
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    throw error;
  }
};

// Record new stats
export const recordNewStats = async (statsData) => {
  try {
    const response = await api.post('/stats', statsData);
    return response.data;
  } catch (error) {
    console.error('Error recording new stats:', error);
    throw error;
  }
};

// Get recent matches
export const getRecentMatches = async (limit = 3) => {
  try {
    const response = await api.get(`/stats/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    throw error;
  }
};

// Get performance trend
export const getPerformanceTrend = async () => {
  try {
    const response = await api.get('/stats/performance');
    return response.data;
  } catch (error) {
    console.error('Error fetching performance trend:', error);
    throw error;
  }
};

// Get announcements for players
export const getAnnouncements = async () => {
  try {
    const response = await api.get('/stats/announcements');
    return response.data || []; // Ensure we always return an array
  } catch (error) {
    console.error('Error fetching announcements:', error);
    // Return empty array instead of throwing error to prevent UI crashes
    return [];
  }
};

// Get stats for a specific player
export const getPlayerStats = async (playerId) => {
  try {
    const response = await api.get(`/stats/player/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }
};

const statsService = {
  getStatsSummary,
  getDetailedStats,
  recordNewStats,
  getRecentMatches,
  getPerformanceTrend,
  getAnnouncements,
  getPlayerStats
};

export default statsService; 