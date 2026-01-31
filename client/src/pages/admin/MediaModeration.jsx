import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiCheck, FiX, FiFilter, FiEye, FiFile, FiFileText, FiImage, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MediaModeration = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [currentPage, setCurrentPage] = useState(1);
  const [mediaPerPage] = useState(9);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [mediaToReject, setMediaToReject] = useState(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await api.get('/api/admin/media');
      console.log('Fetched media:', response.data);
      setMedia(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching media:', error);
      setError('Failed to load media');
      setLoading(false);
    }
  };

  const handleApproveMedia = async (mediaId) => {
    try {
      await api.put(`/api/admin/media/${mediaId}/approve`);
      
      // Update the media in the state
      setMedia(media.map(item => 
        item._id === mediaId ? { ...item, isApproved: true } : item
      ));
      
      toast.success('Media approved successfully');
    } catch (error) {
      console.error('Error approving media:', error);
      toast.error('Failed to approve media');
    }
  };

  const openRejectionModal = (mediaItem) => {
    setMediaToReject(mediaItem);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setMediaToReject(null);
    setRejectionReason('');
  };

  const handleRejectMedia = async (mediaId, reason = '') => {
    try {
      await api.put(`/api/admin/media/${mediaId}/reject`, { reason });
      
      // Update the media in the state
      setMedia(media.map(item => 
        item._id === mediaId ? { ...item, isApproved: false } : item
      ));
      
      toast.success('Media rejected successfully');
      
      // Close modal if open
      if (showRejectionModal) {
        closeRejectionModal();
      }
      
      // Close preview if open
      if (previewMedia && previewMedia._id === mediaId) {
        closePreview();
      }
    } catch (error) {
      console.error('Error rejecting media:', error);
      toast.error('Failed to reject media');
    }
  };

  const submitRejection = () => {
    if (!mediaToReject) return;
    handleRejectMedia(mediaToReject._id, rejectionReason);
  };

  // Determine if a file is an image based on fileType or file extension
  const isImageFile = (item) => {
    if (item.fileType === 'image') return true;
    
    // Check file extension as fallback
    const filePath = item.filePath || item.url || '';
    const extension = filePath.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);
  };

  // Get appropriate media icon based on fileType
  const getMediaIcon = (item) => {
    if (item.fileType === 'video') {
      return (
        <div className="bg-gray-900 p-3 rounded-full">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      );
    } else if (item.fileType === 'document') {
      return (
        <div className="bg-gray-900 p-3 rounded-full">
          <FiFileText className="w-10 h-10 text-gray-400" />
        </div>
      );
    } else {
      return (
        <div className="bg-gray-900 p-3 rounded-full">
          <FiFile className="w-10 h-10 text-gray-400" />
        </div>
      );
    }
  };

  // Get correct file path for display
  const getFilePath = (item) => {
    // First check if we have a fileUrl from the server
    if (item.fileUrl) {
      return item.fileUrl;
    }
    
    // Then check for filePath
    if (item.filePath) {
      // Check if the path already includes the server URL or starts with /uploads
      if (item.filePath.startsWith('http') || item.filePath.startsWith('/uploads')) {
        return item.filePath;
      }
      return `/uploads/${item.filePath}`;
    }
    
    // Fallback to url if present
    if (item.url) {
      return item.url.startsWith('/') ? item.url : `/uploads/${item.url}`;
    }
    
    // Default fallback
    return '/placeholder-image.png';
  };

  // Filter media based on approval status
  const filteredMedia = media.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.isApproved === null;
    if (filter === 'approved') return item.isApproved === true;
    if (filter === 'rejected') return item.isApproved === false;
    return true;
  });

  // Pagination
  const indexOfLastMedia = currentPage * mediaPerPage;
  const indexOfFirstMedia = indexOfLastMedia - mediaPerPage;
  const currentMedia = filteredMedia.slice(indexOfFirstMedia, indexOfLastMedia);
  const totalPages = Math.ceil(filteredMedia.length / mediaPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openPreview = (media) => {
    setPreviewMedia(media);
  };

  const closePreview = () => {
    setPreviewMedia(null);
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
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Media Moderation</h1>
        
        <div className="flex items-center bg-gray-800 rounded-lg p-2">
          <FiFilter className="text-gray-400 mr-2" />
          <select
            className="bg-gray-800 text-white border-none focus:outline-none focus:ring-0"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Media</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentMedia.map((item) => (
          <div key={item._id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {/* Media Preview */}
            <div className="relative h-48 bg-gray-700 overflow-hidden">
              {isImageFile(item) ? (
                <img 
                  src={getFilePath(item)} 
                  alt={item.title || 'Media'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', item);
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNGgtMjR2LTI0aDI0djI0em0tMi0zdjJoLTIwdi0yMGgyMHYxOHoiLz48L3N2Zz4=';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {getMediaIcon(item)}
                </div>
              )}
              
              {/* Status Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full ${
                item.isApproved === true ? 'bg-green-500 text-white' : 
                item.isApproved === false ? 'bg-red-500 text-white' : 
                'bg-yellow-500 text-white'
              }`}>
                {item.isApproved === true ? 'Approved' : 
                 item.isApproved === false ? 'Rejected' : 
                 'Pending'}
              </div>
              
              {/* Preview Button */}
              <button 
                onClick={() => openPreview(item)}
                className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-70 p-2 rounded-full hover:bg-opacity-100 transition-all"
              >
                <FiEye className="text-white" />
              </button>
            </div>
            
            {/* Media Info */}
            <div className="p-4">
              <h3 className="text-white font-semibold truncate">
                {item.title || item.filePath?.split('/').pop() || 'Untitled Media'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Uploaded by: {item.user?.name || 'Unknown User'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Type: {item.fileType || 'Unknown'}
              </p>
              
              {/* Action Buttons */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handleApproveMedia(item._id)}
                  disabled={item.isApproved === true}
                  className={`flex items-center px-3 py-1 rounded-md ${
                    item.isApproved === true
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <FiCheck className="mr-1" />
                  Approve
                </button>
                
                <button
                  onClick={() => openRejectionModal(item)}
                  disabled={item.isApproved === false}
                  className={`flex items-center px-3 py-1 rounded-md ${
                    item.isApproved === false
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <FiX className="mr-1" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-800 rounded-lg">
          <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="mt-4 text-gray-400">No media found matching your filter</p>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-l-md bg-gray-700 text-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1 ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-r-md bg-gray-700 text-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
      
      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closeRejectionModal}>
          <div className="max-w-md w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FiAlertCircle className="text-red-500 mr-2" />
                  Reject Media
                </h3>
                <button onClick={closeRejectionModal} className="text-gray-400 hover:text-white">
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="p-4">
                <p className="text-gray-300 mb-4">
                  You are about to reject "{mediaToReject?.title || 'this media'}". This will delete the file and notify the user.
                </p>
                
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason (optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                ></textarea>
              </div>
              
              <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={closeRejectionModal}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject Media
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closePreview}>
          <div className="max-w-4xl w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {previewMedia.title || previewMedia.filePath?.split('/').pop() || 'Media Preview'}
                </h3>
                <button onClick={closePreview} className="text-gray-400 hover:text-white">
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="p-4">
                {isImageFile(previewMedia) ? (
                  <img 
                    src={getFilePath(previewMedia)} 
                    alt={previewMedia.title || 'Media'} 
                    className="max-h-[70vh] mx-auto"
                    onError={(e) => {
                      console.error('Preview image failed to load:', previewMedia);
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNGgtMjR2LTI0aDI0djI0em0tMi0zdjJoLTIwdi0yMGgyMHYxOHoiLz48L3N2Zz4=';
                    }}
                  />
                ) : previewMedia.fileType === 'video' ? (
                  <video 
                    src={getFilePath(previewMedia)} 
                    controls 
                    className="max-h-[70vh] w-full"
                  ></video>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiFile size={64} className="text-gray-400" />
                    <p className="mt-4 text-gray-300">
                      {previewMedia.fileType === 'document' ? 'Document file' : 'File'} preview not available
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex justify-between">
                  <div>
                    <p className="text-gray-300">
                      <span className="font-bold">Uploaded by:</span> {previewMedia.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-gray-300 mt-1">
                      <span className="font-bold">Date:</span> {new Date(previewMedia.createdAt).toLocaleString()}
                    </p>
                    <p className="text-gray-300 mt-1">
                      <span className="font-bold">File type:</span> {previewMedia.fileType || 'Unknown'}
                    </p>
                    {previewMedia.fileSize && (
                      <p className="text-gray-300 mt-1">
                        <span className="font-bold">Size:</span> {Math.round(previewMedia.fileSize / 1024)} KB
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveMedia(previewMedia._id)}
                      disabled={previewMedia.isApproved === true}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        previewMedia.isApproved === true
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <FiCheck className="mr-2" />
                      Approve
                    </button>
                    
                    <button
                      onClick={() => {
                        closePreview();
                        openRejectionModal(previewMedia);
                      }}
                      disabled={previewMedia.isApproved === false}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        previewMedia.isApproved === false
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      <FiX className="mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaModeration; 