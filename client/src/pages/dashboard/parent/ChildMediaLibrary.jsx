import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaImage, FaVideo, FaFile, FaSearch, FaFilter, FaSpinner, FaDownload, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getChildMedia } from '../../../services/mediaService';
import { getChildDetails } from '../../../services/parentService';
import Button from '../../../components/Button';
import IconButton from '../../../components/IconButton';
import TabButton from '../../../components/TabButton';

const ChildMediaLibrary = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState([]);
  const [childDetails, setChildDetails] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  // Fetch child details
  useEffect(() => {
    const fetchChildDetails = async () => {
      if (!playerId) {
        setError('No player ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const data = await getChildDetails(playerId);
        setChildDetails(data);
      } catch (err) {
        console.error('Error fetching child details:', err);
        setError('Failed to load child details');
      }
    };

    fetchChildDetails();
  }, [playerId]);
  
  // Fetch media items
  useEffect(() => {
    const fetchMediaItems = async () => {
      if (!playerId) return;
      
      try {
        setLoading(true);
        const data = await getChildMedia(playerId);
        setMediaItems(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching media items:', err);
        setError('Failed to load media items');
      } finally {
        setLoading(false);
      }
    };

    fetchMediaItems();
  }, [playerId]);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
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

  const openViewModal = (media) => {
    setSelectedMedia(media);
    setIsViewModalOpen(true);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading media library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-600">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          leftIcon={<FaArrowLeft />}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center mb-4">
        <Button 
          onClick={() => navigate(`/dashboard/parent/child/${playerId}`)} 
          variant="link"
          leftIcon={<FaArrowLeft />}
        >
          Back to Child Profile
        </Button>
      </div>
      
      {/* Header with child info */}
      {childDetails && childDetails.player && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
          <div className="relative mr-4">
            {childDetails.player.profileImage ? (
              <img
                src={childDetails.player.profileImage}
                alt={childDetails.player.name}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-500">
                  {getInitials(childDetails.player.name)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold">{childDetails.player.name}'s Media Library</h1>
            <p className="text-sm text-gray-600">
              View all media files uploaded by your child
            </p>
          </div>
        </div>
      )}
      
      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex space-x-2 overflow-x-auto">
          <TabButton
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            All Files
          </TabButton>
          <TabButton
            isActive={activeTab === 'image'}
            onClick={() => setActiveTab('image')}
            icon={<FaImage />}
          >
            Images
          </TabButton>
          <TabButton
            isActive={activeTab === 'video'}
            onClick={() => setActiveTab('video')}
            icon={<FaVideo />}
          >
            Videos
          </TabButton>
          <TabButton
            isActive={activeTab === 'document'}
            onClick={() => setActiveTab('document')}
            icon={<FaFile />}
          >
            Documents
          </TabButton>
        </div>
        
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by title..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <select
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
      </div>
      
      {/* Media Grid */}
      {sortedMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedMedia.map(media => (
            <div 
              key={media._id} 
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div 
                className="h-44 bg-gray-100 relative cursor-pointer"
                onClick={() => openViewModal(media)}
              >
                <img 
                  src={getThumbnailUrl(media)} 
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded">
                  {getMediaIcon(media.fileType)}
                </div>
                {media.visibility === 'private' && (
                  <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs py-1 px-2 rounded-full">
                    Private
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 mb-1 truncate" title={media.title}>
                  {media.title}
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  {formatDate(media.createdAt)}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {media.fileSize ? `${(media.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                  </span>
                  <div className="flex space-x-1">
                    <IconButton
                      icon={<FaEye />}
                      variant="ghost"
                      ariaLabel="View"
                      onClick={() => openViewModal(media)}
                    />
                    <IconButton
                      icon={<FaDownload />}
                      variant="ghost"
                      ariaLabel="Download"
                      href={`/uploads/${media.filePath}`}
                      download
                      target="_blank"
                      rel="noreferrer"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center">
          <FaFile className="mx-auto text-gray-300 text-5xl mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Media Files Found</h3>
          <p className="text-gray-600">
            {searchQuery ? 
              `No media files matching "${searchQuery}"` : 
              'Your child has not uploaded any media files yet'}
          </p>
        </div>
      )}
      
      {/* View Modal */}
      {isViewModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-90vh overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">{selectedMedia.title}</h3>
              <IconButton 
                icon="×"
                variant="ghost"
                ariaLabel="Close modal"
                onClick={() => setIsViewModalOpen(false)}
              />
            </div>
            <div className="p-6">
              {selectedMedia.fileType === 'image' && (
                <img 
                  src={`/uploads/${selectedMedia.filePath}`} 
                  alt={selectedMedia.title}
                  className="max-w-full mx-auto max-h-[70vh]"
                />
              )}
              {selectedMedia.fileType === 'video' && (
                <video 
                  src={`/uploads/${selectedMedia.filePath}`} 
                  controls 
                  className="max-w-full mx-auto max-h-[70vh]"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {selectedMedia.fileType === 'document' && (
                <div className="text-center">
                  <FaFile className="text-gray-500 text-6xl mx-auto mb-4" />
                  <p className="mb-4">Document preview not available</p>
                  <Button
                    variant="primary"
                    leftIcon={<FaDownload />}
                    href={`/uploads/${selectedMedia.filePath}`}
                    download
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Document
                  </Button>
                </div>
              )}
              
              {selectedMedia.description && (
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-gray-700">{selectedMedia.description}</p>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                Uploaded on {formatDate(selectedMedia.createdAt)}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  leftIcon={<FaDownload />}
                  href={`/uploads/${selectedMedia.filePath}`}
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildMediaLibrary; 