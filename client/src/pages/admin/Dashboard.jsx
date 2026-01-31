import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiUserCheck, FiImage, FiUpload, FiActivity, FiAlertCircle, FiCheck, FiX, FiTrendingUp, FiServer } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import ActivityFeed from '../../components/admin/ActivityFeed';

const Dashboard = () => {
  const [stats, setStats] = useState({
    usersByRole: [],
    activeUsers: 0,
    totalUsers: 0,
    recentMedia: 0,
    userGrowth: [],
    mediaStats: [],
    pendingMediaCount: 0,
    systemHealth: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats from API...');
      
      const response = await api.get('/api/admin/dashboard-stats');
      console.log('Dashboard stats API response:', response.data);
      
      // Ensure we have all the expected data properties
      const data = {
        usersByRole: response.data.usersByRole || [],
        activeUsers: response.data.activeUsers || 0,
        totalUsers: response.data.totalUsers || 0,
        recentMedia: response.data.recentMedia || 0,
        userGrowth: response.data.userGrowth || [],
        mediaStats: response.data.mediaStats || [],
        pendingMediaCount: response.data.pendingMediaCount || 0,
        systemHealth: response.data.systemHealth || {
          status: 'unknown',
          diskUsage: { used: 0, total: 100 }
        }
      };
      
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      setError('Failed to load dashboard statistics');
      setLoading(false);
    }
  };

  // Format data for the role distribution chart
  const roleChartData = stats.usersByRole.map(role => ({
    name: role._id ? (role._id.charAt(0).toUpperCase() + role._id.slice(1)) : 'Unknown',
    count: role.count || 0
  }));

  // Format data for the user growth chart
  const userGrowthData = stats.userGrowth ? stats.userGrowth.map(item => {
    // Ensure we have valid month and year values
    const month = item._id && item._id.month ? item._id.month : 1;
    const year = item._id && item._id.year ? item._id.year : 2023;
    
    return {
      name: `${month}/${year}`,
      users: item.count || 0
    };
  }) : [];

  // Format data for the media type distribution chart
  const mediaTypeData = stats.mediaStats ? stats.mediaStats.map(item => {
    // Handle case where _id might be null
    const name = item._id ? 
      (item._id.charAt(0).toUpperCase() + item._id.slice(1)) : 
      'Unknown';
      
    return {
      name,
      value: item.count || 0
    };
  }) : [];

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Stat cards data
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <FiUsers className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
      link: '/admin/users'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <FiUserCheck className="text-green-500" size={24} />,
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
      link: '/admin/users?filter=active'
    },
    {
      title: 'Recent Uploads',
      value: stats.recentMedia,
      icon: <FiUpload className="text-purple-500" size={24} />,
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500',
      link: '/admin/media'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingMediaCount || 0,
      icon: <FiAlertCircle className="text-yellow-500" size={24} />,
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-500',
      link: '/admin/media?filter=pending'
    }
  ];

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 MB';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

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
        <div className="flex items-center">
          <FiAlertCircle className="mr-2 text-red-400" size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link 
            key={index}
            to={card.link}
            className={`p-6 rounded-lg ${card.bgColor} border border-gray-700 hover:border-gray-500 transition-colors`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.title}</p>
                <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-800">
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* System Health */}
      {stats.systemHealth && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FiServer className="mr-2" /> System Health
            </h2>
            <Link 
              to="/admin/system"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              View Details
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-300 font-medium">Status</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  stats.systemHealth.status === 'healthy' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {stats.systemHealth.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-gray-300 font-medium mb-1">Disk Usage</h3>
              <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                <div 
                  className={`h-2 rounded-full ${
                    (stats.systemHealth.diskUsage.used / stats.systemHealth.diskUsage.total) > 0.9 
                      ? 'bg-red-500' 
                      : (stats.systemHealth.diskUsage.used / stats.systemHealth.diskUsage.total) > 0.7 
                        ? 'bg-yellow-500' 
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${(stats.systemHealth.diskUsage.used / stats.systemHealth.diskUsage.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Used: {formatBytes(stats.systemHealth.diskUsage.used)}</span>
                <span>Total: {formatBytes(stats.systemHealth.diskUsage.total)}</span>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-gray-300 font-medium">Last Backup</h3>
              <p className="text-gray-400 text-sm">
                {stats.systemHealth.lastBackup ? new Date(stats.systemHealth.lastBackup).toLocaleString() : 'No recent backup'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Activity */}
      <ActivityFeed limit={5} autoRefresh={true} />
      
      {/* User Growth Chart */}
      {userGrowthData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
            <FiTrendingUp className="mr-2" /> User Growth (Last 6 Months)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userGrowthData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#9CA3AF' }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F9FAFB'
                  }} 
                />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role distribution chart */}
        {roleChartData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">User Role Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roleChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9CA3AF' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Media Type Distribution */}
        {mediaTypeData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Media Type Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mediaTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {mediaTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend formatter={(value) => <span style={{ color: '#9CA3AF' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/users" className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors">
            <FiUsers size={20} />
            <span>Manage Users</span>
          </Link>
          <Link to="/admin/media" className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors">
            <FiImage size={20} />
            <span>Review Media</span>
          </Link>
          <Link to="/admin/system" className="p-4 bg-green-600 hover:bg-green-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors">
            <FiServer size={20} />
            <span>System Management</span>
          </Link>
          <Link to="/admin/announcements" className="p-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors">
            <FiActivity size={20} />
            <span>New Announcement</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 