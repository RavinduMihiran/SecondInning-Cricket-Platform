import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiUserCheck, FiUserX, FiImage, FiCheckCircle, 
  FiXCircle, FiMessageSquare, FiDatabase, FiLogIn, FiStar, FiEye 
} from 'react-icons/fi';
import api from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ limit = 10, autoRefresh = true }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/activities?limit=${limit}`);
      setActivities(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Set up auto-refresh if enabled
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchActivities();
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [limit, autoRefresh]);

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

  if (loading && activities.length === 0) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        <button 
          onClick={fetchActivities}
          className="text-blue-400 hover:text-blue-300 text-sm"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center text-gray-400 py-4">No recent activities found</div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity._id} 
              className="flex items-start p-3 border border-gray-700 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 rounded-full bg-gray-800 mr-3">
                {getActivityIcon(activity.activityType)}
              </div>
              
              <div className="flex-1">
                <div className="text-sm text-white">
                  {getActivityDescription(activity)}
                </div>
                
                <div className="text-xs text-gray-400 mt-1 flex items-center">
                  <span title={format(new Date(activity.timestamp), 'PPpp')}>
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => {/* Navigate to full activity log */}}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View All Activities
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed; 