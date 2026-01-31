import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getAnnouncements } from '../services/statsService';
import { getUnreadFeedbackCount, getUnreadParentEngagements, markParentEngagementsAsRead } from '../services/playerService';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [parentEngagements, setParentEngagements] = useState([]);
  const [unreadParentEngagementCount, setUnreadParentEngagementCount] = useState(0);
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const { socket, isConnected } = useContext(SocketContext);
  
  // Load last seen announcement timestamp from localStorage
  const getLastSeenTimestamp = () => {
    const timestamp = localStorage.getItem('lastSeenAnnouncement');
    return timestamp ? parseInt(timestamp) : 0;
  };
  
  // Save last seen announcement timestamp to localStorage
  const saveLastSeenTimestamp = (timestamp) => {
    localStorage.setItem('lastSeenAnnouncement', timestamp.toString());
  };
  
  // Initial fetch of announcements
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchInitialAnnouncements = async () => {
      try {
        console.log('Fetching initial announcements...');
        const announcements = await getAnnouncements();
        
        // Store all announcements for use in other components
        setAllAnnouncements(announcements || []);
        
        if (!announcements || announcements.length === 0) return;
        
        const lastSeenTimestamp = getLastSeenTimestamp();
        
        // Filter announcements that are newer than last seen
        const newAnnouncements = announcements.filter(announcement => {
          const announcementTimestamp = new Date(announcement.createdAt).getTime();
          return announcementTimestamp > lastSeenTimestamp;
        });
        
        // Update notifications state
        setNotifications(newAnnouncements);
        setUnreadCount(newAnnouncements.length);
      } catch (error) {
        console.error('Error fetching initial announcements:', error);
      }
    };
    
    fetchInitialAnnouncements();
  }, [isAuthenticated]);
  
  // Fetch unread feedback count for players
  useEffect(() => {
    if (!isAuthenticated || !currentUser || currentUser.role !== 'player') return;
    
    const fetchUnreadFeedbackCount = async () => {
      try {
        const response = await getUnreadFeedbackCount();
        setUnreadFeedbackCount(response.count);
      } catch (error) {
        console.error('Error fetching unread feedback count:', error);
      }
    };
    
    fetchUnreadFeedbackCount();
    
    // Refresh every 2 minutes
    const intervalId = setInterval(fetchUnreadFeedbackCount, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, currentUser]);
  
  // Initial fetch of parent engagements for players
  useEffect(() => {
    if (!isAuthenticated || !currentUser || currentUser.role !== 'player') return;
    
    const fetchInitialParentEngagements = async () => {
      try {
        console.log('Fetching initial parent engagements for player...');
        
        // Use the service function to fetch unread engagements
        const engagements = await getUnreadParentEngagements();
        console.log('Fetched initial parent engagements:', engagements);
        
        // Update state with fetched engagements
        if (engagements && engagements.length > 0) {
          setParentEngagements(engagements.map(engagement => ({
            engagement,
            timestamp: new Date(engagement.createdAt)
          })));
          setUnreadParentEngagementCount(engagements.length);
        }
      } catch (error) {
        console.error('Error fetching initial parent engagements:', error);
      }
    };
    
    fetchInitialParentEngagements();
  }, [isAuthenticated, currentUser]);
  
  // Set up socket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    console.log('Setting up socket event listeners for announcements and feedback...');
    
    // Handle new announcements
    socket.on('new-announcement', (announcement) => {
      console.log('Received new announcement via socket:', announcement);
      
      // Add to all announcements
      setAllAnnouncements(prev => {
        // Check if announcement already exists to prevent duplicates
        const exists = prev.some(a => a._id === announcement._id);
        if (exists) return prev;
        
        // Add new announcement at the beginning (sorted by createdAt desc)
        return [announcement, ...prev];
      });
      
      // Check if it's unread
      const lastSeenTimestamp = getLastSeenTimestamp();
      const announcementTimestamp = new Date(announcement.createdAt).getTime();
      
      if (announcementTimestamp > lastSeenTimestamp) {
        // Add to notifications
        setNotifications(prev => [announcement, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.info(`New announcement: ${announcement.title}`, {
          onClick: () => markAllAsRead()
        });
      }
    });
    
    // Handle updated announcements
    socket.on('update-announcement', (updatedAnnouncement) => {
      console.log('Received updated announcement via socket:', updatedAnnouncement);
      
      // Update in all announcements
      setAllAnnouncements(prev => 
        prev.map(a => a._id === updatedAnnouncement._id ? updatedAnnouncement : a)
      );
      
      // Update in notifications if present
      setNotifications(prev => 
        prev.map(a => a._id === updatedAnnouncement._id ? updatedAnnouncement : a)
      );
    });
    
    // Handle deleted announcements
    socket.on('delete-announcement', ({ id }) => {
      console.log('Received deleted announcement via socket:', id);
      
      // Remove from all announcements
      setAllAnnouncements(prev => prev.filter(a => a._id !== id));
      
      // Remove from notifications and update count if present
      setNotifications(prev => {
        const wasInNotifications = prev.some(a => a._id === id);
        const filtered = prev.filter(a => a._id !== id);
        
        if (wasInNotifications) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        
        return filtered;
      });
    });
    
    // Handle new feedback for players
    if (currentUser && currentUser.role === 'player') {
      socket.on('new-feedback', (feedback) => {
        console.log('Received new feedback via socket:', feedback);
        
        // Increment unread feedback count
        setUnreadFeedbackCount(prev => prev + 1);
        
        // Show toast notification
        toast.info(`New feedback from ${feedback.coach?.name || 'Coach'}`, {
          onClick: () => window.location.href = '/dashboard/profile'
        });
      });
      
      // Handle parent engagements (reactions, comments, stickers)
      socket.on('new_parent_engagement', (data) => {
        console.log('Received new parent engagement via socket:', data);
        
        try {
          // Add to parent engagements list
          if (data && data.engagement) {
            // Play notification sound immediately
            try {
              const notificationSound = new Audio('/notification.mp3');
              notificationSound.volume = 0.7;
              notificationSound.play().catch(e => console.log('Could not play notification sound', e));
            } catch (soundError) {
              console.log('Sound notification not supported', soundError);
            }
            
            // Force update the state with the new engagement
            setParentEngagements(prev => {
              // Check for duplicates by ID
              const isDuplicate = prev.some(item => 
                item.engagement && item.engagement._id === data.engagement._id
              );
              
              if (isDuplicate) {
                console.log('Duplicate engagement notification, ignoring');
                return prev;
              }
              
              console.log('Adding new parent engagement to list:', data);
              return [data, ...prev];
            });
            
            // Increment unread parent engagement count
            setUnreadParentEngagementCount(prev => prev + 1);
            
            // Use the message directly from the server if available
            const message = data.message || 'New reaction from parent!';
            
            // Get reaction type for display
            const reactionType = data.engagement?.reactionType;
            
            // Show toast notification with appropriate icon
            let icon = '👍';
            
            if (reactionType === 'love') {
              icon = '❤️';
            } else if (reactionType === 'proud') {
              icon = '👏';
            } else if (reactionType === 'encouragement') {
              icon = '🙌';
            }
            
            // Use a unique ID for the toast to prevent duplicates
            const toastId = `parent-engagement-${Date.now()}`;
            
            toast.info(
              <div className="flex items-center">
                <span className="text-xl mr-2">{icon}</span>
                <span>{message}</span>
              </div>,
              {
                toastId,
                onClick: () => window.location.href = '/dashboard/profile',
                autoClose: 5000,
                pauseOnHover: true,
                closeOnClick: false
              }
            );
            
            // Send acknowledgment back to server
            if (socket && socket.connected) {
              socket.emit('notification_received', {
                type: 'parent_engagement',
                id: data.engagement._id,
                timestamp: new Date()
              });
            }
            
            // Force refresh the notification dropdown
            document.dispatchEvent(new CustomEvent('refreshNotifications'));
          } else {
            console.error('Received malformed parent engagement notification:', data);
          }
        } catch (error) {
          console.error('Error processing parent engagement notification:', error);
        }
      });
    }
    
    // Cleanup
    return () => {
      socket.off('new-announcement');
      socket.off('update-announcement');
      socket.off('delete-announcement');
      if (currentUser && currentUser.role === 'player') {
        socket.off('new-feedback');
        socket.off('new_parent_engagement');
      }
    };
  }, [socket, isConnected, currentUser]);
  
  // Periodic check for new announcements (as backup to sockets)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkForNewAnnouncements = async () => {
      try {
        console.log('Checking for new announcements (backup to sockets)...');
        const announcements = await getAnnouncements();
        
        // Only update if we got announcements back
        if (!announcements || announcements.length === 0) return;
        
        // Update all announcements
        setAllAnnouncements(announcements);
        
        const lastSeenTimestamp = getLastSeenTimestamp();
        
        // Filter announcements that are newer than last seen
        const newAnnouncements = announcements.filter(announcement => {
          const announcementTimestamp = new Date(announcement.createdAt).getTime();
          return announcementTimestamp > lastSeenTimestamp;
        });
        
        // Update notifications state
        setNotifications(newAnnouncements);
        setUnreadCount(newAnnouncements.length);
      } catch (error) {
        console.error('Error checking for new announcements:', error);
      }
    };
    
    // Check every 2 minutes as a backup to socket events
    const intervalId = setInterval(checkForNewAnnouncements, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    if (notifications.length > 0) {
      // Get the timestamp of the most recent announcement
      const latestTimestamp = Math.max(
        ...notifications.map(n => new Date(n.createdAt).getTime())
      );
      
      // Save it as last seen
      saveLastSeenTimestamp(latestTimestamp);
      
      // Update state
      setUnreadCount(0);
    }
  };
  
  // Reset unread feedback count
  const resetUnreadFeedbackCount = () => {
    setUnreadFeedbackCount(0);
  };
  
  // Reset unread parent engagement count and mark as read in the database
  const resetUnreadParentEngagementCount = useCallback(async () => {
    setUnreadParentEngagementCount(0);
    
    // Mark engagements as read in the database using the service function
    try {
      const result = await markParentEngagementsAsRead();
      console.log(`Marked ${result.count} parent engagements as read`);
      
      // Update the engagement objects in state to reflect read status
      setParentEngagements(prev => 
        prev.map(item => ({
          ...item,
          engagement: {
            ...item.engagement,
            isRead: true
          }
        }))
      );
    } catch (error) {
      console.error('Error marking parent engagements as read:', error);
    }
  }, []);
  
  // Force refresh announcements (can be called from components)
  const refreshAnnouncements = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('Manually refreshing announcements...');
      const announcements = await getAnnouncements();
      setAllAnnouncements(announcements || []);
      
      const lastSeenTimestamp = getLastSeenTimestamp();
      
      // Filter announcements that are newer than last seen
      const newAnnouncements = announcements.filter(announcement => {
        const announcementTimestamp = new Date(announcement.createdAt).getTime();
        return announcementTimestamp > lastSeenTimestamp;
      });
      
      // Update notifications state
      setNotifications(newAnnouncements);
      setUnreadCount(newAnnouncements.length);
    } catch (error) {
      console.error('Error refreshing announcements:', error);
    }
  };
  
  return (
    <NotificationContext.Provider 
      value={{ 
        notifications,
        allAnnouncements, 
        unreadCount,
        unreadFeedbackCount,
        parentEngagements,
        unreadParentEngagementCount,
        markAllAsRead,
        resetUnreadFeedbackCount,
        resetUnreadParentEngagementCount,
        refreshAnnouncements
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 