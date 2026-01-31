import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import notificationService from '../services/notificationService';
import { reconnectSocket } from '../services/socket';
import api from '../services/api';

const MediaNotifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Initialize notification service
    if (userId) {
      console.log('MediaNotifications: Setting up notification handlers for user', userId);
      
      try {
        // Set up handlers for media approval/rejection
        const approvedUnsubscribe = notificationService.onMediaApproved((data) => {
          console.log('Received approval notification in component:', data);
          handleNewNotification({
            type: 'approved',
            title: data.title,
            mediaId: data.mediaId,
            message: 'Your media has been approved',
            timestamp: new Date(),
          });
          setConnectionStatus('connected');
        });
        
        const rejectedUnsubscribe = notificationService.onMediaRejected((data) => {
          console.log('Received rejection notification in component:', data);
          handleNewNotification({
            type: 'rejected',
            title: data.title,
            mediaId: data.mediaId,
            message: `Your media has been rejected${data.reason ? `: ${data.reason}` : ''}`,
            timestamp: new Date(),
          });
          setConnectionStatus('connected');
        });
        
        // Fetch existing notifications
        fetchNotifications();
        
        // Clean up
        return () => {
          console.log('MediaNotifications: Cleaning up notification handlers');
          approvedUnsubscribe();
          rejectedUnsubscribe();
        };
      } catch (error) {
        console.error('Error setting up notification handlers:', error);
        setConnectionStatus('error');
      }
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch recent media with moderation status
      const response = await api.get('/api/media', {
        params: { includeModerated: true }
      });
      
      console.log('Fetched media for notifications:', response.data);
      
      // Filter to only show recently moderated items
      const moderatedMedia = response.data
        .filter(item => item.isApproved !== null && item.moderationDate)
        .map(item => ({
          type: item.isApproved ? 'approved' : 'rejected',
          title: item.title,
          mediaId: item._id,
          message: item.isApproved 
            ? 'Your media has been approved' 
            : `Your media has been rejected${item.moderationReason ? `: ${item.moderationReason}` : ''}`,
          timestamp: new Date(item.moderationDate || item.updatedAt || item.createdAt),
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10); // Show only 10 most recent
      
      setNotifications(moderatedMedia);
      setLoading(false);
      
      if (moderatedMedia.length > 0) {
        console.log('Found moderated media notifications:', moderatedMedia.length);
        setConnectionStatus('has-data');
      } else {
        console.log('No moderated media found');
      }
    } catch (error) {
      console.error('Error fetching media notifications:', error);
      setLoading(false);
      setConnectionStatus('error');
    }
  };

  const handleNewNotification = (notification) => {
    console.log('Adding new notification to list:', notification);
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  const handleDismiss = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleReconnect = () => {
    console.log('Attempting to reconnect notification service');
    setConnectionStatus('connecting');
    reconnectSocket();
    
    // Re-initialize notification service
    if (userId) {
      setTimeout(() => {
        notificationService.init(userId);
        fetchNotifications();
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <span className="text-gray-400">Loading notifications...</span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center p-4">
        <div className="flex items-center justify-center mb-2">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'error' ? 'bg-red-500' :
            connectionStatus === 'has-data' ? 'bg-blue-500' :
            'bg-yellow-500'
          }`}></span>
          <span className="text-gray-400">
            {connectionStatus === 'connected' ? 'Connected, waiting for notifications' :
             connectionStatus === 'error' ? 'Connection error' :
             connectionStatus === 'has-data' ? 'Connected with data' :
             'Connecting...'}
          </span>
          
          {connectionStatus === 'error' && (
            <button 
              onClick={handleReconnect}
              className="ml-3 flex items-center text-blue-500 hover:text-blue-400"
            >
              <FiRefreshCw className="mr-1" size={14} />
              Reconnect
            </button>
          )}
        </div>
        <p className="text-gray-500">No notifications to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Media Updates</h3>
        <div className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
          }`}></span>
          <button 
            onClick={handleReconnect}
            className="text-gray-400 hover:text-white flex items-center"
            title="Refresh notifications"
          >
            <FiRefreshCw size={14} />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {notifications.map((notification, index) => (
          <div 
            key={`${notification.mediaId}-${index}`}
            className={`p-3 rounded-lg flex items-start ${
              notification.type === 'approved' 
                ? 'bg-green-900/20 border border-green-500/30' 
                : 'bg-red-900/20 border border-red-500/30'
            }`}
          >
            <div className="mr-3 mt-1">
              {notification.type === 'approved' ? (
                <FiCheckCircle className="text-green-500" size={18} />
              ) : (
                <FiXCircle className="text-red-500" size={18} />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium text-white">{notification.title}</p>
                <button 
                  onClick={() => handleDismiss(index)}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>
              <p className="text-sm text-gray-300">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaNotifications; 