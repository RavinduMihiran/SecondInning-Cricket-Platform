import { useState, useEffect, useRef } from 'react';
import { FaImage, FaVideo, FaFile, FaUpload, FaFolder, FaSearch, FaFilter, FaSpinner, FaTimes, FaTrash, FaEdit, FaEye, FaEyeSlash, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getUserMedia, uploadMedia, deleteMedia, updateMedia } from '../../services/mediaService';

const MediaLibrary = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    visibility: 'public',
    mediaFile: null
  });
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    visibility: 'public'
  });

  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    setLoading(true);
    try {
      const data = await getUserMedia();
      setMediaItems(data);
    } catch (error) {
      console.error('Failed to fetch media items:', error);
      toast.error('Failed to load media items');
    } finally {
      setLoading(false);
    }
  };

  // Filter media based on active tab and search query
  const filteredMedia = mediaItems.filter(item => {
    const matchesTab = activeTab === 'all' || item.fileType === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Sort media items
  const sortedMedia = [...filteredMedia].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name_asc':
        return a.title.localeCompare(b.title);
      case 'name_desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'image': return <FaImage className="text-blue-500" />;
      case 'video': return <FaVideo className="text-red-500" />;
      case 'document': return <FaFile className="text-gray-500" />;
      default: return <FaFile className="text-gray-500" />;
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const getThumbnailUrl = (media) => {
    if (media.fileType === 'image') {
      return `/uploads/${media.filePath}`;
    } else if (media.fileType === 'video') {
      return media.thumbnail 
        ? `/uploads/${media.thumbnail}`
        : 'https://via.placeholder.com/300x200?text=Video';
    } else if (media.fileType === 'document') {
      const ext = getFileExtension(media.filePath);
      if (ext === 'pdf') {
        return 'https://via.placeholder.com/300x200?text=PDF+Document';
      } else if (['doc', 'docx'].includes(ext)) {
        return 'https://via.placeholder.com/300x200?text=Word+Document';
      } else if (['xls', 'xlsx'].includes(ext)) {
        return 'https://via.placeholder.com/300x200?text=Excel+Document';
      } else {
        return 'https://via.placeholder.com/300x200?text=Document';
      }
    }
    return 'https://via.placeholder.com/300x200?text=File';
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadForm({
        ...uploadForm,
        mediaFile: file,
        title: file.name // Default title to file name
      });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.mediaFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('mediaFile', uploadForm.mediaFile);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('visibility', uploadForm.visibility);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      await uploadMedia(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Media uploaded successfully');
      setIsUploadModalOpen(false);
      setUploadForm({
        title: '',
        description: '',
        visibility: 'public',
        mediaFile: null
      });
      
      // Refresh media list
      fetchMediaItems();
      
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      try {
        await deleteMedia(mediaId);
        toast.success('Media deleted successfully');
        
        // Remove from state
        setMediaItems(prev => prev.filter(item => item._id !== mediaId));
        
        // Close modal if open
        if (selectedMedia && selectedMedia._id === mediaId) {
          setIsViewModalOpen(false);
          setIsEditModalOpen(false);
        }
      } catch (error) {
        console.error('Error deleting media:', error);
        if (error.response) {
          toast.error(`Failed to delete media: ${error.response.data.message || 'Server error'}`);
        } else if (error.request) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error('Failed to delete media');
        }
      }
    }
  };

  const openViewModal = (media) => {
    setSelectedMedia(media);
    setIsViewModalOpen(true);
  };

  const openEditModal = (media) => {
    setSelectedMedia(media);
    setEditForm({
      title: media.title,
      description: media.description || '',
      visibility: media.visibility
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateMedia(selectedMedia._id, editForm);
      toast.success('Media updated successfully');
      
      // Update in state
      setMediaItems(prev => prev.map(item => 
        item._id === selectedMedia._id 
          ? { ...item, ...editForm } 
          : item
      ));
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Failed to update media');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <FaUpload /> Upload New
        </button>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search media..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select 
            className="input py-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort by: Date (Newest)</option>
            <option value="oldest">Sort by: Date (Oldest)</option>
            <option value="name_asc">Sort by: Name (A-Z)</option>
            <option value="name_desc">Sort by: Name (Z-A)</option>
          </select>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex overflow-x-auto space-x-4">
          <button
            className={`pb-2 px-1 font-medium border-b-2 ${
              activeTab === 'all' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Media
          </button>
          <button
            className={`pb-2 px-1 font-medium border-b-2 ${
              activeTab === 'image' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('image')}
          >
            Images
          </button>
          <button
            className={`pb-2 px-1 font-medium border-b-2 ${
              activeTab === 'video' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('video')}
          >
            Videos
          </button>
          <button
            className={`pb-2 px-1 font-medium border-b-2 ${
              activeTab === 'document' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('document')}
          >
            Documents
          </button>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
          <p className="text-gray-500">Loading media items...</p>
        </div>
      )}
      
      {/* Media Grid */}
      {!loading && sortedMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedMedia.map(item => (
            <div 
              key={item._id} 
              className="card bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openViewModal(item)}
            >
              <div className="h-40 bg-gray-100 relative">
                <img 
                  src={getThumbnailUrl(item)} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-white p-1 rounded-full">
                  {getMediaIcon(item.fileType)}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  {item.visibility === 'public' ? (
                    <span className="flex items-center"><FaEye className="mr-1" /> Public</span>
                  ) : item.visibility === 'private' ? (
                    <span className="flex items-center"><FaEyeSlash className="mr-1" /> Private</span>
                  ) : (
                    <span className="flex items-center"><FaEye className="mr-1" /> Coaches & Scouts</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 mb-1 truncate">{item.title}</h3>
                <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <FaFolder className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No media found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Upload some media to get started'}
          </p>
          {!searchQuery && (
            <button 
              className="mt-4 btn btn-primary"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Media
            </button>
          )}
        </div>
      )}
      
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Media</h2>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={uploading}
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit}>
              {!uploadForm.mediaFile ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
              <FaUpload className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-600">Drag and drop files here, or click to browse</p>
              <input 
                type="file" 
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      {uploadForm.mediaFile.type.startsWith('image/') ? (
                        <FaImage className="text-blue-500 mr-2" />
                      ) : uploadForm.mediaFile.type.startsWith('video/') ? (
                        <FaVideo className="text-red-500 mr-2" />
                      ) : (
                        <FaFile className="text-gray-500 mr-2" />
                      )}
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {uploadForm.mediaFile.name}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setUploadForm({...uploadForm, mediaFile: null})}
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    className="input w-full h-24"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility
                  </label>
                  <select
                    className="input w-full"
                    value={uploadForm.visibility}
                    onChange={(e) => setUploadForm({...uploadForm, visibility: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="coaches_scouts">Coaches & Scouts Only</option>
                  </select>
                </div>
              </div>
              
              {uploading && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-sm mt-1 text-gray-600">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex items-center gap-2"
                  disabled={uploading || !uploadForm.mediaFile}
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Media Modal */}
      {isViewModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold truncate">{selectedMedia.title}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditModal(selectedMedia)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => handleDeleteMedia(selectedMedia._id)}
                  className="p-2 rounded-full hover:bg-gray-100 text-red-500"
                  title="Delete"
                >
                  <FaTrash />
                </button>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3">
                  {selectedMedia.fileType === 'image' ? (
                    <img 
                      src={getThumbnailUrl(selectedMedia)} 
                      alt={selectedMedia.title} 
                      className="w-full rounded-lg object-contain max-h-[60vh]"
                    />
                  ) : selectedMedia.fileType === 'video' ? (
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                      <video 
                        src={`/uploads/${selectedMedia.filePath}`}
                        controls
                        className="max-h-[60vh] max-w-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center p-8">
                      <FaFile className="text-gray-400 text-6xl mb-4" />
                      <p className="text-gray-600 text-center">
                        {selectedMedia.title}
                      </p>
                      <a 
                        href={`/uploads/${selectedMedia.filePath}`}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 btn btn-primary flex items-center gap-2"
                      >
                        <FaDownload /> Download
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="md:w-1/3 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Uploaded</h3>
                    <p>{formatDate(selectedMedia.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Type</h3>
                    <p className="flex items-center">
                      {getMediaIcon(selectedMedia.fileType)}
                      <span className="ml-2 capitalize">{selectedMedia.fileType}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Visibility</h3>
                    <p className="flex items-center">
                      {selectedMedia.visibility === 'public' ? (
                        <>
                          <FaEye className="mr-2" />
                          Public
                        </>
                      ) : selectedMedia.visibility === 'private' ? (
                        <>
                          <FaEyeSlash className="mr-2" />
                          Private
                        </>
                      ) : (
                        <>
                          <FaEye className="mr-2" />
                          Coaches & Scouts
                        </>
                      )}
                    </p>
                  </div>
                  
                  {selectedMedia.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMedia.description}</p>
                    </div>
                  )}
                  
                  {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedMedia.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Media Modal */}
      {isEditModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Media</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  className="input w-full h-24"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  className="input w-full"
                  value={editForm.visibility}
                  onChange={(e) => setEditForm({...editForm, visibility: e.target.value})}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="coaches_scouts">Coaches & Scouts Only</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
        </div>
      </div>
      )}
    </div>
  );
};

export default MediaLibrary; 