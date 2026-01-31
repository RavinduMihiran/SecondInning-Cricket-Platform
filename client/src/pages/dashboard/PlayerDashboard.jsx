import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { joinRooms } from '../../services/socket';
import MediaNotifications from '../../components/MediaNotifications';
import notificationService from '../../services/notificationService';
import { FiBell } from 'react-icons/fi';
// ... other imports

const PlayerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('unknown');
  // ... other state variables
  
  useEffect(() => {
    // Join socket rooms when component mounts
    if (user && user.id) {
      console.log('PlayerDashboard: Initializing socket connection for user', user.id);
      joinRooms(user.id, 'player');
      
      // Initialize notification service
      try {
        notificationService.init(user.id);
        setNotificationStatus('connected');
      } catch (error) {
        console.error('Error initializing notification service:', error);
        setNotificationStatus('error');
      }
    }
    
    fetchPlayerStats();
    // ... other initial data fetching
    
    // Cleanup
    return () => {
      if (user && user.id) {
        console.log('PlayerDashboard: Cleaning up notification service');
        notificationService.cleanup();
      }
    };
  }, [user]);
  
  const fetchPlayerStats = async () => {
    // Implementation of fetchPlayerStats
    console.log('Fetching player stats...');
    setLoading(false);
  };
  
  const testNotification = () => {
    console.log('Testing notification system');
    try {
      const result = notificationService.testNotification();
      setNotificationStatus(result ? 'tested' : 'error');
    } catch (error) {
      console.error('Error testing notification:', error);
      setNotificationStatus('error');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Player Dashboard</h1>
        
        {/* Notification Test Button */}
        <div className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
            notificationStatus === 'connected' ? 'bg-green-500' :
            notificationStatus === 'error' ? 'bg-red-500' :
            notificationStatus === 'tested' ? 'bg-blue-500' :
            'bg-yellow-500'
          }`}></span>
          <button 
            onClick={testNotification}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            title="Test notifications"
          >
            <FiBell className="mr-1" />
            Test Notifications
          </button>
        </div>
      </div>
      
      {/* Notifications Section */}
      {user && user.id && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <MediaNotifications userId={user.id} />
        </div>
      )}
      
      {/* Rest of dashboard content */}
      {/* ... */}
    </div>
  );
};

export default PlayerDashboard; 