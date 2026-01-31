import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaCommentAlt, FaHeart, FaThumbsUp, FaSmile } from 'react-icons/fa';
import { NotificationContext } from '../contexts/NotificationContext';
import { AuthContext } from '../contexts/AuthContext';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead,
    unreadFeedbackCount,
    resetUnreadFeedbackCount,
    parentEngagements,
    unreadParentEngagementCount,
    resetUnreadParentEngagementCount
  } = useContext(NotificationContext);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Calculate total unread notifications
  const totalUnreadCount = unreadCount + unreadFeedbackCount + unreadParentEngagementCount;
  
  // Listen for custom refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Refreshing notification dropdown');
      // Force a re-render by toggling the dropdown if it's open
      if (isOpen) {
        setIsOpen(false);
        setTimeout(() => setIsOpen(true), 100);
      }
    };
    
    document.addEventListener('refreshNotifications', handleRefresh);
    
    return () => {
      document.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleViewFeedback = () => {
    setIsOpen(false);
    resetUnreadFeedbackCount();
    navigate('/dashboard/profile');
  };
  
  const handleViewEngagements = () => {
    setIsOpen(false);
    resetUnreadParentEngagementCount();
    
    // Navigate to profile page and scroll to engagements section if it exists
    navigate('/dashboard/profile', { 
      state: { scrollToEngagements: true } 
    });
  };
  
  // Get icon for reaction type
  const getReactionIcon = (reactionType) => {
    switch(reactionType) {
      case 'love':
        return <FaHeart className="text-red-500" />;
      case 'proud':
        return <FaThumbsUp className="text-blue-500" />;
      case 'encouragement':
        return <FaSmile className="text-yellow-500" />;
      default:
        return <FaHeart className="text-gray-500" />;
    }
  };
  
  // Force refresh parent engagements when dropdown opens
  useEffect(() => {
    if (isOpen && currentUser?.role === 'player' && unreadParentEngagementCount > 0) {
      console.log('Dropdown opened, refreshing parent engagements display');
    }
  }, [isOpen, currentUser, unreadParentEngagementCount]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button 
        onClick={handleToggle}
        className="p-2 rounded-full hover:bg-gray-100 relative"
        aria-label="Notifications"
      >
        <FaBell className="h-4 w-4 text-gray-600" />
        {totalUnreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center notification-badge">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-800">Notifications</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <FaTimes size={14} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Parent Engagement notifications for players */}
            {currentUser?.role === 'player' && unreadParentEngagementCount > 0 && (
              <div 
                onClick={handleViewEngagements}
                className="block p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full mt-1.5 mr-2 bg-red-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      <FaHeart className="inline-block mr-1 text-red-500" />
                      New Parent Reactions
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      You have {unreadParentEngagementCount} new reaction{unreadParentEngagementCount > 1 ? 's' : ''} from your parent.
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Click to view
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Display recent parent engagements */}
            {currentUser?.role === 'player' && parentEngagements?.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 px-2 mb-1">RECENT PARENT REACTIONS</p>
                {parentEngagements.slice(0, 3).map((item, index) => {
                  // Skip rendering if engagement data is missing
                  if (!item || !item.engagement) return null;
                  
                  return (
                    <div 
                      key={item.engagement._id || `parent-engagement-${index}`} 
                      className="flex items-center p-2 hover:bg-gray-50 rounded"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/dashboard/profile');
                      }}
                    >
                      <div className="mr-3">
                        {getReactionIcon(item.engagement.reactionType)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-800">
                          <span className="font-medium">{item.engagement.parent?.name || 'A parent'}</span>
                          {' '}
                          {item.engagement.reactionType === 'love' && 'sent you love'}
                          {item.engagement.reactionType === 'proud' && 'is proud of you'}
                          {item.engagement.reactionType === 'encouragement' && 'is encouraging you'}
                          {!['love', 'proud', 'encouragement'].includes(item.engagement.reactionType) && 'reacted to your profile'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(item.timestamp || new Date(item.engagement.createdAt || Date.now()))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feedback notification for players */}
            {currentUser?.role === 'player' && unreadFeedbackCount > 0 && (
              <div 
                onClick={handleViewFeedback}
                className="block p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full mt-1.5 mr-2 bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      <FaCommentAlt className="inline-block mr-1 text-green-500" />
                      New Coach Feedback
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      You have {unreadFeedbackCount} new feedback message{unreadFeedbackCount > 1 ? 's' : ''} from your coach.
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Click to view
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Announcements */}
            {notifications.length > 0 ? (
              <div>
                {notifications.map((notification, index) => (
                  <Link
                    key={notification._id || index}
                    to="/dashboard/announcements"
                    className="block p-3 border-b border-gray-100 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-start">
                      <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${
                        notification.type === 'event' ? 'bg-blue-500' :
                        notification.type === 'trial' ? 'bg-green-500' :
                        notification.type === 'update' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              !unreadFeedbackCount && !unreadParentEngagementCount && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No new notifications
              </div>
              )
            )}
          </div>

          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <Link
              to="/dashboard/announcements"
              className="block text-center text-xs text-blue-500 hover:text-blue-700 py-1"
              onClick={() => setIsOpen(false)}
            >
              View all announcements
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 