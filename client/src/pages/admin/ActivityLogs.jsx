import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiUserCheck, FiUserX, FiImage, FiCheckCircle, 
  FiXCircle, FiMessageSquare, FiDatabase, FiLogIn, FiStar, FiEye,
  FiSearch, FiFilter, FiRefreshCw, FiCalendar, FiDownload
} from 'react-icons/fi';
import api from '../../services/api';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    activityType: '',
    searchQuery: '',
    dateFrom: '',
    dateTo: '',
    limit: 100
  });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.activityType) queryParams.append('activityType', filters.activityType);
      if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      queryParams.append('limit', filters.limit);
      
      const response = await api.get(`/api/admin/activities?${queryParams.toString()}`);
      setActivities(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Helper function to get activity icon
  const getActivityIcon = (activityType) => {
    const iconProps = { className: "text-lg" };
    
    switch (activityType) {
      case 'user_joined':
        return <FiUser {...iconProps} className="text-green-400" />;
      case 'user_updated':
        return <FiUserCheck {...iconProps} className="text-blue-400" />;
      case 'user_deactivated':
        return <FiUserX {...iconProps} className="text-red-400" />;
      case 'media_uploaded':
        return <FiImage {...iconProps} className="text-purple-400" />;
      case 'media_approved':
        return <FiCheckCircle {...iconProps} className="text-green-400" />;
      case 'media_rejected':
        return <FiXCircle {...iconProps} className="text-red-400" />;
      case 'announcement_created':
        return <FiMessageSquare {...iconProps} className="text-yellow-400" />;
      case 'system_backup':
        return <FiDatabase {...iconProps} className="text-blue-400" />;
      case 'admin_login':
        return <FiLogIn {...iconProps} className="text-red-400" />;
      case 'coach_login':
        return <FiLogIn {...iconProps} className="text-blue-400" />;
      case 'player_login':
        return <FiLogIn {...iconProps} className="text-green-400" />;
      case 'scout_login':
        return <FiLogIn {...iconProps} className="text-yellow-400" />;
      case 'player_rated':
        return <FiStar {...iconProps} className="text-yellow-400" />;
      case 'player_added_to_watchlist':
        return <FiEye {...iconProps} className="text-purple-400" />;
      default:
        return <FiUser {...iconProps} className="text-gray-400" />;
    }
  };

  // Helper function to get activity description
  const getActivityDescription = (activity) => {
    const { activityType, user, performedBy, details } = activity;
    
    switch (activityType) {
      case 'user_joined':
        return (
          <span>
            New user <span className="font-medium">{user?.name || details?.name || 'Unknown'}</span> joined as {details?.role || 'player'}
          </span>
        );
      case 'user_updated':
        return (
          <span>
            User <span className="font-medium">{user?.name || details?.userName || 'Unknown'}</span> was updated
          </span>
        );
      case 'user_deactivated':
        return (
          <span>
            User <span className="font-medium">{user?.name || details?.userName || 'Unknown'}</span> was deactivated
          </span>
        );
      case 'media_uploaded':
        return (
          <span>
            <span className="font-medium">{user?.name || 'User'}</span> uploaded {details?.fileType || 'media'}: {details?.title || 'Untitled'}
          </span>
        );
      case 'media_approved':
        return (
          <span>
            Media <span className="font-medium">{details?.mediaTitle || 'Untitled'}</span> was approved
          </span>
        );
      case 'media_rejected':
        return (
          <span>
            Media <span className="font-medium">{details?.mediaTitle || 'Untitled'}</span> was rejected
          </span>
        );
      case 'announcement_created':
        return (
          <span>
            New announcement: <span className="font-medium">{details?.title || 'Untitled'}</span>
          </span>
        );
      case 'system_backup':
        return <span>System backup completed</span>;
      case 'admin_login':
        return <span>Admin logged in</span>;
      case 'coach_login':
        return (
          <span>
            Coach <span className="font-medium">{user?.name || details?.name || 'Unknown'}</span> logged in
          </span>
        );
      case 'player_login':
        return (
          <span>
            Player <span className="font-medium">{user?.name || details?.name || 'Unknown'}</span> logged in
          </span>
        );
      case 'scout_login':
        return (
          <span>
            Scout <span className="font-medium">{user?.name || details?.name || 'Unknown'}</span> logged in
          </span>
        );
      case 'player_rated':
        return (
          <span>
            Player <span className="font-medium">{user?.name || 'Unknown'}</span> was rated
          </span>
        );
      case 'player_added_to_watchlist':
        return (
          <span>
            Player <span className="font-medium">{user?.name || 'Unknown'}</span> was added to watchlist
          </span>
        );
      default:
        return <span>Unknown activity</span>;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchActivities();
  };

  const handleReset = () => {
    setFilters({
      activityType: '',
      searchQuery: '',
      dateFrom: '',
      dateTo: '',
      limit: 100
    });
    // Fetch with reset filters
    setTimeout(fetchActivities, 0);
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Timestamp', 'Activity Type', 'User', 'Description', 'IP Address'];
    const rows = activities.map(activity => [
      format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      activity.activityType,
      activity.user?.name || 'N/A',
      getActivityDescription(activity).props ? 'Activity' : getActivityDescription(activity), // Simplified for CSV
      activity.metadata?.ip || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchActivities}
            className="btn btn-sm btn-outline flex items-center"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-sm btn-outline flex items-center"
          >
            <FiDownload className="mr-1" />
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Activity Type</label>
            <select
              name="activityType"
              value={filters.activityType}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md text-white px-3 py-2 text-sm"
            >
              <option value="">All Activities</option>
              <option value="user_joined">User Joined</option>
              <option value="user_updated">User Updated</option>
              <option value="user_deactivated">User Deactivated</option>
              <option value="media_uploaded">Media Uploaded</option>
              <option value="media_approved">Media Approved</option>
              <option value="media_rejected">Media Rejected</option>
              <option value="announcement_created">Announcement Created</option>
              <option value="admin_login">Admin Login</option>
              <option value="coach_login">Coach Login</option>
              <option value="player_login">Player Login</option>
              <option value="scout_login">Scout Login</option>
              <option value="player_rated">Player Rated</option>
              <option value="player_added_to_watchlist">Added to Watchlist</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                name="searchQuery"
                value={filters.searchQuery}
                onChange={handleFilterChange}
                placeholder="Search users, details..."
                className="w-full bg-gray-700 border border-gray-600 rounded-md text-white pl-9 pr-3 py-2 text-sm"
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">From Date</label>
            <div className="relative">
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md text-white pl-9 pr-3 py-2 text-sm"
              />
              <FiCalendar className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">To Date</label>
            <div className="relative">
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md text-white pl-9 pr-3 py-2 text-sm"
              />
              <FiCalendar className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              <FiFilter className="mr-1" />
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-outline"
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {/* Results */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {loading && activities.length === 0 ? (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg m-4">
            <p>{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-gray-400 p-10">
            No activity logs found matching your criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {activities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-300" title={format(new Date(activity.timestamp), 'PPpp')}>
                        {format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1 rounded-full bg-gray-700 mr-2">
                          {getActivityIcon(activity.activityType)}
                        </div>
                        <span className="text-sm text-gray-300">
                          {activity.activityType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {activity.user ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                            {activity.user.profileImage ? (
                              <img 
                                src={activity.user.profileImage} 
                                alt={activity.user.name} 
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium">
                                {activity.user.name.substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-200">{activity.user.name}</div>
                            <div className="text-xs text-gray-400">{activity.user.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-300">
                        {getActivityDescription(activity)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {activity.metadata?.ip || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs; 