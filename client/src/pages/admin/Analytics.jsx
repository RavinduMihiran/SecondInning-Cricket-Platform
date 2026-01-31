import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { FiFilter, FiDownload, FiRefreshCw } from 'react-icons/fi';

const Analytics = () => {
  const [stats, setStats] = useState({
    usersByRole: [],
    activeUsers: 0,
    totalUsers: 0,
    recentMedia: 0,
    userGrowth: [],
    mediaStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('year'); // week, month, year

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/dashboard-stats');
      
      console.log('Dashboard stats:', response.data);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load analytics data');
      setLoading(false);
    }
  };

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Format data for the role distribution chart from actual API data
  const roleChartData = stats.usersByRole?.map(role => ({
    name: role._id.charAt(0).toUpperCase() + role._id.slice(1),
    value: role.count
  })) || [];

  // Format user growth data
  const formatUserGrowthData = () => {
    if (!stats.userGrowth || stats.userGrowth.length === 0) {
      return [];
    }
    
    return stats.userGrowth.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      new: item.count
    }));
  };

  // Format media stats data
  const formatMediaStatsData = () => {
    if (!stats.mediaStats || stats.mediaStats.length === 0) {
      return [];
    }
    
    return stats.mediaStats.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count
    }));
  };

  // Calculate active users data from user growth
  const calculateActiveUsersData = () => {
    const growthData = formatUserGrowthData();
    if (growthData.length === 0) {
      return [];
    }
    
    let cumulativeUsers = 0;
    return growthData.map(item => {
      cumulativeUsers += item.new;
      return {
        ...item,
        active: cumulativeUsers
      };
    });
  };

  const userActivityData = calculateActiveUsersData();
  const userGrowthData = formatUserGrowthData();
  const mediaStatsData = formatMediaStatsData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-800 rounded-lg p-2">
            <FiFilter className="text-gray-400 mr-2" />
            <select
              className="bg-gray-800 text-white border-none focus:outline-none focus:ring-0"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          <button 
            onClick={fetchDashboardStats}
            className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg"
            title="Refresh Data"
          >
            <FiRefreshCw />
          </button>
          
          <button 
            className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg"
            title="Export Data"
          >
            <FiDownload />
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Total Users</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers || 0}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Active Users</h3>
          <p className="text-3xl font-bold text-green-500 mt-1">{stats.activeUsers || 0}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Recent Uploads</h3>
          <p className="text-3xl font-bold text-blue-500 mt-1">{stats.recentMedia || 0}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Engagement Rate</h3>
          <p className="text-3xl font-bold text-purple-500 mt-1">
            {stats.activeUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Activity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userActivityData.length > 0 ? userActivityData : []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="active" 
                  name="Active Users" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  name="New Users" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Role Distribution Chart */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Role Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData.length > 0 ? roleChartData : []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(roleChartData.length > 0 ? roleChartData : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Media Type Distribution */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Media Type Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mediaStatsData.length > 0 ? mediaStatsData : []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(mediaStatsData.length > 0 ? mediaStatsData : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* User Growth Chart */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userGrowthData.length > 0 ? userGrowthData : []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend />
                <Bar dataKey="new" name="New Users" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Global Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <select
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="player">Players</option>
              <option value="coach">Coaches</option>
              <option value="scout">Scouts</option>
              <option value="admin">Admins</option>
              <option value="parent">Parents</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Team
            </label>
            <select
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              <option value="team1">Team A</option>
              <option value="team2">Team B</option>
              <option value="team3">Team C</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Date Range
            </label>
            <select
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 