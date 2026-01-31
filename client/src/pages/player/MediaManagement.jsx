import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiUpload, FiTrash2, FiEye, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { joinRooms } from '../../services/socket';
import notificationService from '../../services/notificationService';

const MediaManagement = () => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectedMedia, setShowRejectedMedia] = useState(false);
  // ... other state variables

  useEffect(() => {
    // Join socket rooms for notifications
    if (user && user.id) {
      joinRooms(user.id, 'player');
      notificationService.init(user.id);
      
      // Set up handlers for media approval/rejection
      const approvedUnsubscribe = notificationService.onMediaApproved(() => {
        fetchMedia(); // Refresh media list when item is approved
      });
      
      const rejectedUnsubscribe = notificationService.onMediaRejected(() => {
        fetchMedia(true); // Refresh media list including rejected items
        setShowRejectedMedia(true); // Show rejected tab automatically
      });
      
      // Clean up
      return () => {
        approvedUnsubscribe();
        rejectedUnsubscribe();
      };
    }
    
    fetchMedia();
  }, [user]);

  const fetchMedia = async (includeRejected = false) => {
    try {
      setLoading(true);
      const response = await api.get('/api/media', {
        params: { includeModerated: includeRejected }
      });
      setMedia(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to load your media');
      setLoading(false);
    }
  };

  // Get filtered media based on approval status
  const getFilteredMedia = () => {
    if (showRejectedMedia) {
      return media.filter(item => item.isApproved === false);
    } else {
      return media.filter(item => item.isApproved !== false);
    }
  };

  // ... other functions for upload, delete, etc.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">My Media</h1>
        
        <div className="flex space-x-4">
          {/* Toggle between active and rejected media */}
          <div className="flex rounded-md overflow-hidden">
            <button
              onClick={() => setShowRejectedMedia(false)}
              className={`px-4 py-2 ${!showRejectedMedia 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300'}`}
            >
              Active Media
            </button>
            <button
              onClick={() => setShowRejectedMedia(true)}
              className={`px-4 py-2 flex items-center ${showRejectedMedia 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300'}`}
            >
              <FiAlertCircle className="mr-1" />
              Rejected
            </button>
          </div>
          
          {/* Upload button - only show when viewing active media */}
          {!showRejectedMedia && (
            <button
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={() => { /* Open upload modal */ }}
            >
              <FiUpload className="mr-2" />
              Upload
            </button>
          )}
        </div>
      </div>
      
      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {getFilteredMedia().map((item) => (
          <div key={item._id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {/* Media Preview */}
            <div className="relative h-48 bg-gray-700 overflow-hidden">
              {item.isApproved === false ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <FiAlertCircle size={48} className="text-red-500 mb-2" />
                  <p className="text-gray-300 text-center px-4">
                    This media was rejected
                  </p>
                </div>
              ) : item.fileType === 'image' ? (
                <img 
                  src={item.fileUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNGgtMjR2LTI0aDI0djI0em0tMi0zdjJoLTIwdi0yMGgyMHYxOHoiLz48L3N2Zz4=';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {/* Display appropriate icon based on file type */}
                </div>
              )}
              
              {/* Status Badge */}
              {item.isApproved !== null && (
                <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full ${
                  item.isApproved === true ? 'bg-green-500 text-white' : 
                  item.isApproved === false ? 'bg-red-500 text-white' : 
                  'bg-yellow-500 text-white'
                }`}>
                  {item.isApproved === true ? 'Approved' : 
                   item.isApproved === false ? 'Rejected' : 
                   'Pending'}
                </div>
              )}
            </div>
            
            {/* Media Info */}
            <div className="p-4">
              <h3 className="text-white font-semibold truncate">
                {item.title}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              
              {/* Show rejection reason if available */}
              {item.isApproved === false && item.moderationReason && (
                <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-sm">
                  <p className="text-red-300">
                    <span className="font-bold">Reason:</span> {item.moderationReason}
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-between mt-4">
                {item.isApproved !== false ? (
                  <>
                    <button
                      className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      onClick={() => { /* View media */ }}
                    >
                      <FiEye className="mr-1" />
                      View
                    </button>
                    
                    <button
                      className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md"
                      onClick={() => { /* Delete media */ }}
                    >
                      <FiTrash2 className="mr-1" />
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md w-full justify-center"
                    onClick={() => { /* Remove rejected media */ }}
                  >
                    <FiTrash2 className="mr-1" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {getFilteredMedia().length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-800 rounded-lg">
          <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="mt-4 text-gray-400">
            {showRejectedMedia 
              ? 'No rejected media found' 
              : 'You haven\'t uploaded any media yet'}
          </p>
        </div>
      )}
      
      {/* Upload Modal, Preview Modal, etc. */}
      {/* ... */}
    </div>
  );
};

export default MediaManagement; 