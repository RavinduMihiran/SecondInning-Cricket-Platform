import { useState, useEffect, useContext, useRef } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaSpinner, FaSync, FaBell } from 'react-icons/fa';
import { NotificationContext } from '../../contexts/NotificationContext';
import { SocketContext } from '../../contexts/SocketContext';
import ConnectionStatus from '../../components/ConnectionStatus';

const Announcements = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [newAnnouncementIds, setNewAnnouncementIds] = useState(new Set());
  const [animatedAnnouncementId, setAnimatedAnnouncementId] = useState(null);
  const { allAnnouncements, markAllAsRead, refreshAnnouncements } = useContext(NotificationContext);
  const { socket, isConnected } = useContext(SocketContext);
  const announcementsRef = useRef(null);
  const announcementRefs = useRef({});
  
  useEffect(() => {
    const initializeAnnouncements = async () => {
      try {
        setLoading(true);
        // Mark all announcements as read when the page is visited
        markAllAsRead();
        // Wait for a moment to ensure context is updated
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('Error initializing announcements:', err);
        setError('Failed to load announcements. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAnnouncements();
  }, [markAllAsRead]);
  
  // Listen for real-time announcement updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // When a new announcement arrives, add its ID to the set of new announcements
    const handleNewAnnouncement = (announcement) => {
      console.log('New announcement received in Announcements component:', announcement);
      setNewAnnouncementIds(prev => new Set(prev).add(announcement._id));
      setAnimatedAnnouncementId(announcement._id);
      
      // Scroll to the new announcement with a slight delay
      setTimeout(() => {
        if (announcementRefs.current[announcement._id]) {
          announcementRefs.current[announcement._id].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else if (announcementsRef.current) {
          // Fallback to scrolling to the top of announcements section
          window.scrollTo({
            top: announcementsRef.current.offsetTop - 100,
            behavior: 'smooth'
          });
        }
        
        // Clear animation after 5 seconds
        setTimeout(() => {
          setAnimatedAnnouncementId(null);
        }, 5000);
      }, 300);
    };
    
    // Handle updated announcement
    const handleUpdatedAnnouncement = (announcement) => {
      console.log('Updated announcement received:', announcement);
      setAnimatedAnnouncementId(announcement._id);
      
      // Clear animation after 3 seconds
      setTimeout(() => {
        setAnimatedAnnouncementId(null);
      }, 3000);
    };
    
    // Handle deleted announcement
    const handleDeletedAnnouncement = ({ id }) => {
      console.log('Deleted announcement received:', id);
      // Remove from new announcements if present
      setNewAnnouncementIds(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    };
    
    socket.on('new-announcement', handleNewAnnouncement);
    socket.on('update-announcement', handleUpdatedAnnouncement);
    socket.on('delete-announcement', handleDeletedAnnouncement);
    
    return () => {
      socket.off('new-announcement', handleNewAnnouncement);
      socket.off('update-announcement', handleUpdatedAnnouncement);
      socket.off('delete-announcement', handleDeletedAnnouncement);
    };
  }, [socket, isConnected]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAnnouncements();
      setError(null);
    } catch (err) {
      console.error('Error refreshing announcements:', err);
      setError('Failed to refresh announcements. Please try again.');
    } finally {
      setTimeout(() => setRefreshing(false), 500); // Show refresh animation for at least 500ms
    }
  };
  
  // Format date string to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get background color based on announcement type
  const getTypeStyles = (type) => {
    switch (type) {
      case 'event':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'trial':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'update':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };
  
  // Check if an announcement is new (received via socket)
  const isNewAnnouncement = (id) => {
    return newAnnouncementIds.has(id);
  };
  
  // Clear new announcement indicator
  const clearNewIndicator = (id) => {
    setNewAnnouncementIds(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading announcements...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6" ref={announcementsRef}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <div className="flex items-center gap-2">
          <ConnectionStatus className="mr-2" />
          <button 
            onClick={handleRefresh} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm ${refreshing ? 'opacity-70' : 'hover:bg-primary-dark'}`}
            disabled={refreshing}
          >
            <FaSync className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {allAnnouncements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No announcements available at this time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {allAnnouncements.map((announcement, index) => {
            const typeStyles = getTypeStyles(announcement?.type || 'general');
            const isNew = isNewAnnouncement(announcement._id);
            const isAnimated = animatedAnnouncementId === announcement._id;
            
            return (
              <div 
                key={announcement?._id || index} 
                ref={el => announcementRefs.current[announcement._id] = el}
                className={`border ${typeStyles.border} rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-500 
                  ${isNew ? 'shadow-md transform -translate-y-1' : ''} 
                  ${isAnimated ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                onClick={() => isNew && clearNewIndicator(announcement._id)}
              >
                <div className={`${typeStyles.bg} ${typeStyles.text} px-4 py-2 font-medium flex justify-between items-center`}>
                  <div className="flex items-center">
                    <span className="capitalize">{announcement?.type || 'general'}</span>
                    {isNew && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                        <FaBell className="mr-1 h-2.5 w-2.5" /> New
                      </span>
                    )}
                  </div>
                  <span className="text-sm">{announcement?.createdAt ? formatDate(announcement.createdAt) : 'No date'}</span>
                </div>
                
                <div className={`p-4 ${isNew ? 'bg-yellow-50' : ''} ${isAnimated && !isNew ? 'bg-blue-50' : ''}`}>
                  <h2 className="text-xl font-bold mb-2">{announcement?.title || 'Untitled'}</h2>
                  
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    {announcement?.startDate && (
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-1" />
                        <span>
                          {formatDate(announcement.startDate)}
                          {announcement?.endDate && ` - ${formatDate(announcement.endDate)}`}
                        </span>
                      </div>
                    )}
                    
                    {announcement?.location && (
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>{announcement.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {announcement?.content || 'No content available'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Announcements; 