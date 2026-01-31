import { useState, useEffect, useContext, useRef } from 'react';
import { FaEdit, FaCamera, FaUser, FaSchool, FaMapMarkerAlt, FaUserEdit, FaRegCalendarAlt, FaBolt, FaTrophy, FaAward, FaMedal, FaStar, FaRegStar, FaCertificate, FaFilter, FaSearch, FaSpinner, FaTimes, FaCalendarAlt, FaComment, FaRunning, FaChartBar, FaPlus, FaSync, FaUsers, FaCrown, FaGem, FaRibbon, FaCheckCircle, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';
import { GiCricketBat, GiLaurelsTrophy, GiTrophyCup, GiPodium, GiLaurels, GiMedal, GiStarMedal } from 'react-icons/gi';
import { BiMedal, BiTrophy } from 'react-icons/bi';
import { getPlayerAchievements, getPlayerAchievementStats } from '../../services/achievementService';
import { getCurrentPlayerProfile, getPlayerDetailedStats, updatePlayerProfile, updateProfileImage, uploadProfileImage, getPlayerFeedback, markFeedbackAsRead, getPlayerRatings } from '../../services/playerService';
import { getDetailedStats, recordNewStats } from '../../services/statsService';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import StatsRecordModal from '../../components/StatsRecordModal';
import { NotificationContext } from '../../contexts/NotificationContext';
import { sriLankaDistricts } from '../../utils/districtUtils';
import DistrictDropdown from '../../components/DistrictDropdown';
import { Link } from 'react-router-dom';

// Rating Stars Component
const RatingStars = ({ rating, maxRating = 5 }) => {
  // Convert rating from 1-10 scale to stars display (correctly)
  // Use Math.ceil to ensure consistent display across the app
  const normalizedRating = Math.ceil((rating / 10) * maxRating);
  
  return (
    <div className="flex items-center">
      {[...Array(maxRating)].map((_, i) => (
        <span key={i}>
          {i < normalizedRating ? (
            <FaStar className="text-yellow-500" />
          ) : (
            <FaRegStar className="text-gray-300" />
          )}
        </span>
      ))}
      <span className="ml-2 font-medium">{rating}/10</span>
    </div>
  );
};

// Profile Edit Modal Component
const ProfileEditModal = ({ isOpen, onClose, player, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    district: '',
    dateOfBirth: '',
    bio: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        school: player.school || '',
        district: player.district || '',
        dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth).toISOString().split('T')[0] : '',
        bio: player.bio || '',
        phone: player.phone || '',
      });
      setImagePreview(player.profileImage || '');
    }
  }, [player]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  // Helper function to resize and compress image
  const resizeAndCompressImage = (file) => {
    return new Promise((resolve) => {
      // Create an image element
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        
        // Calculate new dimensions (max 400px width/height - smaller than before)
        let width = img.width;
        let height = img.height;
        const maxSize = 400;
        
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image on canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with reduced quality
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.4); // 40% quality JPEG - reduced from 60%
      };
    });
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      // Resize and compress the image
      const compressedBlob = await resizeAndCompressImage(imageFile);
      
      // Convert compressed blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedBlob);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, handle image upload if there's a new image
      let profileImageUrl = player.profileImage;
      if (imageFile) {
        // Compress the image first
        const compressedBlob = await resizeAndCompressImage(imageFile);
        
        // Create a file from the blob
        const compressedFile = new File([compressedBlob], imageFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        try {
          // Use the uploadProfileImage service function with direct URL
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const formData = new FormData();
          formData.append('image', compressedFile);
          
          // Use fetch API directly for better control
          const response = await fetch(`${apiUrl}/players/me/profile-image/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Upload successful, received:', data);
          profileImageUrl = data.profileImage;
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          toast.error('Failed to upload image. Please try again.');
          // Don't proceed with profile update if image upload fails
          setIsSubmitting(false);
          return;
        }
      }

      // Then update profile data
      const updatedProfile = await updatePlayerProfile({
        ...formData,
        profileImage: profileImageUrl
      });

      toast.success('Profile updated successfully');
      onProfileUpdate(updatedProfile);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div 
              className="relative cursor-pointer"
              onClick={handleImageClick}
            >
              {imagePreview ? (
                <img 
                  src={typeof imagePreview === 'string' && imagePreview.startsWith('http') ? getImageUrl(imagePreview) : imagePreview}
                  alt="Profile Preview" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-light"
                  onError={(e) => {
                    // Prevent infinite error loops
                    if (e.target.getAttribute('data-error-handled')) return;
                    
                    console.error('Error loading preview image:', imagePreview);
                    e.target.setAttribute('data-error-handled', 'true');
                    e.target.onerror = null; // Remove the handler
                    e.target.style.display = 'none'; // Hide the img element
                    
                    // Show fallback
                    setImagePreview('');
                  }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <FaUser className="text-gray-400 text-4xl" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2">
                <FaCamera />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-2">Click to change profile picture</p>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input w-full"
              placeholder="Your full name"
              required
            />
          </div>

          {/* School */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              School
            </label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleChange}
              className="input w-full"
              placeholder="Your school"
            />
          </div>

          {/* District */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              District
            </label>
            <DistrictDropdown
              value={formData.district}
              onChange={handleChange}
              labelText=""
            />
          </div>

          {/* Date of Birth */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date of Birth
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="input w-full pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input w-full"
              placeholder="Your phone number"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="input w-full h-24"
              placeholder="Tell us about yourself"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Coach Feedback Component
const CoachFeedbackSection = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const { resetUnreadFeedbackCount } = useContext(NotificationContext);
  
  useEffect(() => {
    const fetchFeedback = async () => {
      let shouldShowError = true;
      try {
        setLoading(true);
        const data = await getPlayerFeedback();
        
        if (data && Array.isArray(data)) {
          // Filter out any feedback items with missing coach data
          const validFeedback = data.filter(item => item && item.coach);
          setFeedback(validFeedback);
          shouldShowError = false;
          
          // Mark unread feedback as read
          const unreadFeedback = validFeedback.filter(item => !item.isRead);
          if (unreadFeedback.length > 0) {
            try {
              await Promise.all(
                unreadFeedback.map(async (item) => {
                  try {
                    await markFeedbackAsRead(item._id);
                  } catch (markError) {
                    console.warn(`Could not mark feedback ${item._id} as read:`, markError);
                    // Continue with other feedback items even if one fails
                  }
                })
              );
              resetUnreadFeedbackCount();
            } catch (markError) {
              console.error('Error marking feedback as read:', markError);
              // Don't show toast for this error as it's not critical
            }
          }
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
        // Only show error toast if we couldn't get valid data
        if (shouldShowError) {
          toast.error('Failed to load coach feedback');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeedback();
  }, [resetUnreadFeedbackCount]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'batting':
        return <GiCricketBat className="text-blue-500" />;
      case 'bowling':
        return <FaBolt className="text-green-500" />;
      case 'fielding':
        return <FaUser className="text-yellow-500" />;
      case 'fitness':
        return <FaRunning className="text-red-500" />;
      default:
        return <FaComment className="text-gray-500" />;
    }
  };
  
  const getCategoryColor = (category) => {
    switch (category) {
      case 'batting':
        return 'bg-blue-50 border-blue-200';
      case 'bowling':
        return 'bg-green-50 border-green-200';
      case 'fielding':
        return 'bg-yellow-50 border-yellow-200';
      case 'fitness':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <FaSpinner className="animate-spin text-primary text-2xl" />
      </div>
    );
  }
  
  if (feedback.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FaComment className="mx-auto text-3xl mb-2 text-gray-300" />
        <p>No feedback from coaches yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {feedback.map((item, index) => {
        // Skip rendering if coach data is missing
        if (!item || !item.coach) return null;
        
        const categoryColorClass = getCategoryColor(item.category);
        
        return (
          <div 
            key={index} 
            className={`border rounded-lg p-4 ${
              !item.isRead ? 'bg-blue-50 border-blue-200' : categoryColorClass
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                {item.coach.profileImage ? (
                  <img 
                    src={item.coach.profileImage} 
                    alt={item.coach.name} 
                    className="w-10 h-10 rounded-full object-cover mr-3"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 ${
                    item.coach.profileImage ? 'hidden' : ''
                  }`}
                >
                  <FaUser className="text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium">{item.coach.name || 'Coach'}</h4>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-1">{getCategoryIcon(item.category)}</span>
                    <span className="capitalize">{item.category || 'General'}</span>
                    <span className="mx-2">•</span>
                    <span>{item.createdAt ? formatDate(item.createdAt) : 'Recent'}</span>
                  </div>
                </div>
              </div>
              
              {!item.isRead && (
                <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  New
                </div>
              )}
            </div>
            
            <div className="mt-3 text-gray-700 whitespace-pre-wrap">
              {item.feedback || 'No feedback content'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PlayerProfile = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [achievements, setAchievements] = useState([]);
  const [achievementStats, setAchievementStats] = useState(null);
  const [achievementCategory, setAchievementCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [coachRatings, setCoachRatings] = useState(null);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  
  const { user } = useContext(AuthContext);
  const { resetUnreadFeedbackCount } = useContext(NotificationContext);
  
  // Fetch player profile and detailed stats on component mount
  useEffect(() => {
    fetchPlayerProfile();
    fetchCoachRatings();
  }, []);
  
  // Fetch achievements when tab changes or category changes
  useEffect(() => {
    if (activeTab === 'achievements') {
      console.log('Fetching achievements, user object:', user);
      fetchAchievements();
      fetchAchievementStats();
    } else if (activeTab === 'stats' && !detailedStats) {
      fetchDetailedStats();
    }
  }, [activeTab, achievementCategory]);
  
  const fetchPlayerProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await getCurrentPlayerProfile();
      setPlayer(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch player profile', error);
      setError('Failed to load player profile. Please try again later.');
      toast.error('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleProfileUpdate = (updatedProfile) => {
    console.log('Profile updated with new data:', updatedProfile);
    // Make sure we're updating the full player object with all its properties
    setPlayer(updatedProfile);
    
    // Force a re-render by creating a new timestamp
    setPlayer(prev => ({
      ...prev,
      _timestamp: new Date().getTime()
    }));
  };
  
  const fetchDetailedStats = async () => {
    setStatsLoading(true);
    try {
      const data = await getPlayerDetailedStats();
      setDetailedStats(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch detailed stats', error);
      setError('Failed to load detailed stats. Please try again later.');
      toast.error('Failed to load stats data');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        setError('User information not available. Please try again later.');
        return;
      }
      
      // Use either user.id or user._id, whichever is available
      const userId = user.id || user._id;
      if (!userId) {
        setError('User ID not available. Please try again later.');
        return;
      }
      
      const category = achievementCategory !== 'all' ? achievementCategory : null;
      console.log(`Fetching achievements for userId: ${userId}, category: ${category}`);
      const data = await getPlayerAchievements(userId, category);
      console.log('Achievement data received:', data);
      setAchievements(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch achievements', error);
      setError('Failed to load achievements. Please try again later.');
      toast.error('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAchievementStats = async () => {
    try {
      if (!user) {
        console.log('No user object available for fetching achievement stats');
        return;
      }
      
      // Use either user.id or user._id, whichever is available
      const userId = user.id || user._id;
      if (!userId) {
        console.log('No user ID available for fetching achievement stats');
        return;
      }
      
      console.log(`Fetching achievement stats for userId: ${userId}`);
      const data = await getPlayerAchievementStats(userId);
      console.log('Achievement stats received:', data);
      setAchievementStats(data);
    } catch (error) {
      console.error('Failed to fetch achievement stats', error);
      // Don't show error toast for this as it's not critical
    }
  };
  
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get appropriate icon for achievement category
  const getAchievementIcon = (category) => {
    switch (category) {
      case 'Batting':
        return <FaBolt className="text-secondary h-5 w-5" />;
      case 'Bowling':
        return <GiCricketBat className="text-primary h-5 w-5" />;
      case 'Fielding':
        return <FaAward className="text-green-500 h-5 w-5" />;
      case 'All-Round':
        return <FaStar className="text-yellow-500 h-5 w-5" />;
      case 'Team':
        return <FaUserEdit className="text-purple-500 h-5 w-5" />;
      case 'Career':
        return <FaCertificate className="text-blue-500 h-5 w-5" />;
      case 'Special':
        return <GiLaurelsTrophy className="text-amber-500 h-5 w-5" />;
      default:
        return <FaTrophy className="text-primary-light h-5 w-5" />;
    }
  };

  // Function to get background color for achievement tier
  const getTierStyles = (tier) => {
    switch (tier) {
      case 'Bronze':
        return 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md';
      case 'Silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-300 text-white shadow-md';
      case 'Gold':
        return 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white shadow-md';
      case 'Platinum':
        return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md';
      case 'Diamond':
        return 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md';
    }
  };
  
  // Use a data URL approach for profile images
  const getImageUrl = (url) => {
    if (!url) return '';
    
    // If it's already a data URL, return it
    if (url.startsWith('data:')) return url;
    
    // If it's a server URL, convert it to a placeholder and trigger fetch
    if (url.includes('/uploads/')) {
      // Fetch the image as a blob and convert to data URL
      fetch(url, { mode: 'cors', credentials: 'include' })
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.blob();
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // Update the player object with the data URL
            setPlayer(prev => ({
              ...prev,
              profileImage: reader.result,
              _timestamp: new Date().getTime()
            }));
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('Error fetching image:', error);
          // On error, show initials instead
          setPlayer(prev => ({
            ...prev,
            profileImage: '',
            _timestamp: new Date().getTime()
          }));
        });
      
      // Return empty string while loading
      return '';
    }
    
    return url;
  };
  
  const handleStatsAdded = (updatedStats) => {
    setDetailedStats(updatedStats);
    // Refresh player profile to get updated stats
    fetchPlayerProfile();
  };
  
  const fetchCoachRatings = async () => {
    setRatingsLoading(true);
    try {
      const data = await getPlayerRatings();
      if (data.hasRatings) {
        // Use the most recent individual rating instead of the average
        // This ensures consistency with what the coach sees
        if (data.mostRecentRating) {
          setCoachRatings(data.mostRecentRating);
        } else {
          setCoachRatings(data.ratings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch coach ratings:', error);
      // Don't show error toast as this is not critical
    } finally {
      setRatingsLoading(false);
    }
  };
  
  // Loading state for the entire profile
  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading profile data...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }
  
  // If no player data, show error
  if (!player) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-600">Unable to load profile data. Please try again later.</p>
        <button 
          onClick={() => fetchPlayerProfile()} 
          className="mt-2 text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      {/* Profile Header */}
      <div className="card bg-white p-6 mb-8 relative">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Image */}
          <div className="relative">
            {player.profileImage ? (
              <img 
                src={getImageUrl(player.profileImage)}
                alt={player.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
                onError={(e) => {
                  // Prevent infinite error loops
                  if (e.target.getAttribute('data-error-handled')) return;
                  
                  console.error('Error loading image:', player.profileImage);
                  e.target.setAttribute('data-error-handled', 'true');
                  e.target.onerror = null; // Remove the handler to prevent loops
                  e.target.style.display = 'none'; // Hide the img element
                  
                  // Show the fallback without manipulating DOM directly
                  const fallbackDiv = e.target.nextSibling;
                  if (fallbackDiv) {
                    fallbackDiv.classList.remove('hidden');
                  }
                }}
              />
            ) : null}
            <div className={player.profileImage ? "hidden" : "w-32 h-32 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-white shadow"}>
              {getInitials(player.name)}
            </div>
            <button 
              className="absolute bottom-0 right-0 bg-secondary text-white rounded-full p-2 hover:bg-secondary-dark"
              onClick={() => setIsEditModalOpen(true)}
            >
              <FaCamera />
            </button>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{player.name}</h2>
            <p className="text-gray-600 mb-2">{player.email}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {player.role && (
                <span className="badge bg-primary-light text-white">
                  {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                </span>
              )}
              {player.school && (
                <span className="badge bg-secondary-light text-white">
                  {player.school}
                </span>
              )}
              {player.district && (
                <span className="badge bg-green-500 text-white">
                  {player.district}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex space-x-2">
          <button 
            className="text-gray-500 hover:text-primary"
            onClick={() => setIsEditModalOpen(true)}
          >
            <FaEdit className="h-5 w-5" title="Edit Profile" />
          </button>
        </div>
      </div>
      
      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        player={player}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {/* Stats Record Modal */}
      <StatsRecordModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onStatsAdded={handleStatsAdded}
      />
      
      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex overflow-x-auto">
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === 'info' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('info')}
          >
            Personal Info
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === 'stats' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            Cricket Stats
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === 'achievements' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="card bg-white p-6">
        {activeTab === 'info' && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium mb-4">Basic Details</h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FaUser className="mt-1 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{player.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaSchool className="mt-1 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">School</p>
                      <p className="font-medium">{player.school || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="mt-1 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">District</p>
                      <p className="font-medium">{player.district || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaRegCalendarAlt className="mt-1 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Birth Date</p>
                      <p className="font-medium">{player.dateOfBirth ? formatDate(player.dateOfBirth) : 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-4">About Me</h4>
                <p className="text-gray-700">{player.bio || 'No bio information provided yet.'}</p>
                
                <h4 className="text-lg font-medium mt-6 mb-4">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {player.interests && player.interests.length > 0 ? (
                    player.interests.map((interest, index) => (
                      <span key={index} className="badge bg-gray-200 text-gray-800 py-1 px-3">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No interests specified yet.</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Coach Feedback & Rating Combined Section */}
            <div className="mt-8 border-t pt-6">
              <h4 className="text-lg font-medium mb-4 flex items-center">
                <FaComment className="text-primary mr-2" />
                Coach Feedback & Ratings
              </h4>
              
              <div className="bg-white border rounded-lg overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b">
                  <button
                    className={`py-2 px-4 font-medium flex items-center ${
                      !ratingsLoading && coachRatings ? 'text-yellow-500' : 'text-gray-500'
                    }`}
                    onClick={() => document.getElementById('ratings-tab').scrollIntoView({ behavior: 'smooth' })}
                  >
                    <FaStar className="mr-2" />
                    Ratings
                  </button>
                  <button
                    className="py-2 px-4 font-medium flex items-center text-primary"
                    onClick={() => document.getElementById('feedback-tab').scrollIntoView({ behavior: 'smooth' })}
                  >
                    <FaComment className="mr-2" />
                    Feedback
                  </button>
                </div>
                
                {/* Ratings Tab */}
                <div id="ratings-tab" className="p-4">
                  {coachRatings ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                          <RatingStars rating={coachRatings.overall} />
                          <span className="ml-2 text-sm text-gray-500">Overall Rating</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-md text-center">
                          <div className="text-sm text-gray-500 mb-1">Batting</div>
                          <RatingStars rating={coachRatings.batting} maxRating={3} />
                        </div>
                        <div className="bg-white p-3 rounded-md text-center">
                          <div className="text-sm text-gray-500 mb-1">Bowling</div>
                          <RatingStars rating={coachRatings.bowling} maxRating={3} />
                        </div>
                        <div className="bg-white p-3 rounded-md text-center">
                          <div className="text-sm text-gray-500 mb-1">Fielding</div>
                          <RatingStars rating={coachRatings.fielding} maxRating={3} />
                        </div>
                        <div className="bg-white p-3 rounded-md text-center">
                          <div className="text-sm text-gray-500 mb-1">Fitness</div>
                          <RatingStars rating={coachRatings.fitness} maxRating={3} />
                        </div>
                      </div>
                      
                      {coachRatings.lastUpdated && (
                        <div className="text-xs text-gray-500 text-center mt-4">
                          Last updated: {new Date(coachRatings.lastUpdated).toLocaleDateString()}
                          {coachRatings.coachName && (
                            <span> by Coach {coachRatings.coachName}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : ratingsLoading ? (
                    <div className="flex justify-center py-4">
                      <FaSpinner className="animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No ratings from coaches yet</p>
                    </div>
                  )}
                </div>
                
                {/* Feedback Tab */}
                <div id="feedback-tab" className="p-4 border-t">
                  <CoachFeedbackSection />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Cricket Statistics</h3>
            
            {statsLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
                <p className="text-gray-600">Loading statistics...</p>
              </div>
            ) : detailedStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Batting Stats */}
                <div>
                  <div className="flex items-center mb-4">
                    <FaBolt className="text-secondary mr-2 h-5 w-5" />
                    <h4 className="text-lg font-medium">Batting</h4>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-sm">Total Runs</p>
                        <p className="font-medium">{detailedStats.battingStats.totalRuns}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Average</p>
                        <p className="font-medium">{detailedStats.battingStats.battingAverage?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Strike Rate</p>
                        <p className="font-medium">{detailedStats.battingStats.strikeRate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Highest Score</p>
                        <p className="font-medium">{detailedStats.battingStats.highestScore}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">50s / 100s</p>
                        <p className="font-medium">{detailedStats.battingStats.fifties} / {detailedStats.battingStats.hundreds}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Total 4s / 6s</p>
                        <p className="font-medium">{detailedStats.battingStats.totalFours} / {detailedStats.battingStats.totalSixes}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bowling Stats */}
                <div>
                  <div className="flex items-center mb-4">
                    <GiCricketBat className="text-primary mr-2 h-5 w-5" />
                    <h4 className="text-lg font-medium">Bowling</h4>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-sm">Total Wickets</p>
                        <p className="font-medium">{detailedStats.bowlingStats.totalWickets}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Economy</p>
                        <p className="font-medium">{detailedStats.bowlingStats.economy}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Best Figures</p>
                        <p className="font-medium">{detailedStats.bowlingStats.bestFigures}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Average</p>
                        <p className="font-medium">{detailedStats.bowlingStats.bowlingAverage?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Total Overs</p>
                        <p className="font-medium">{detailedStats.bowlingStats.totalOvers}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Total Maidens</p>
                        <p className="font-medium">{detailedStats.bowlingStats.totalMaidens}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No statistics available. Start adding match stats to see your performance.</p>
              </div>
            )}
            
            <div className="mt-8 text-center">
              <button 
                className="btn btn-primary"
                onClick={() => setIsStatsModalOpen(true)}
              >
                Record New Stats
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h3 className="text-xl font-semibold">Achievements</h3>
              
              <div className="flex items-center gap-3">
                {/* Refresh Button */}
                <button 
                  onClick={() => {
                    fetchAchievements();
                    fetchAchievementStats();
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  title="Refresh Achievements"
                  disabled={isLoading}
                >
                  <FaSync className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-400" />
                <select 
                    className="select select-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                  value={achievementCategory}
                  onChange={(e) => setAchievementCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Batting">Batting</option>
                  <option value="Bowling">Bowling</option>
                  <option value="Fielding">Fielding</option>
                  <option value="All-Round">All-Round</option>
                  <option value="Team">Team</option>
                  <option value="Career">Career</option>
                  <option value="Special">Special</option>
                </select>
                </div>
              </div>
            </div>
            
            {/* Achievements Summary */}
            {achievementStats && (
              <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 rounded-xl shadow-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{achievementStats.total || 0}</div>
                    <div className="text-sm font-medium text-blue-100">Total Achievements</div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-3">
                    {achievementStats.byTier && achievementStats.byTier.map(tier => (
                      <div key={tier._id} className="text-center bg-white/20 py-2 px-4 rounded-lg backdrop-blur-sm">
                        <div className="text-xl font-bold">{tier.count}</div>
                        <div className="text-xs font-medium">{tier._id}</div>
                      </div>
                    ))}
                    {(!achievementStats.byTier || achievementStats.byTier.length === 0) && (
                      <div className="text-center">
                        <div className="text-sm">No achievements yet</div>
                      </div>
                    )}
                  </div>
                  
                  {achievementStats.latest ? (
                    <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                      <div className="text-xs uppercase tracking-wide text-blue-100 font-semibold mb-1">Latest Achievement</div>
                      <div className="font-medium text-lg">{achievementStats.latest.title}</div>
                      <div className="text-xs text-blue-100 mt-1">{formatDate(achievementStats.latest.achievementDate)}</div>
                    </div>
                  ) : (
                    <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                      <div className="text-xs uppercase tracking-wide text-blue-100 font-semibold">Latest Achievement</div>
                      <div className="font-medium">None yet</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Achievements List */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
                <p className="text-gray-600">Loading your achievements...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {achievements.length > 0 ? (
                  achievements.map(achievement => (
                    <div key={achievement._id} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 bg-white">
                      <div className="flex items-start gap-5">
                        <div className={`p-4 rounded-lg text-white ${
                          achievement.category === 'Batting' ? 'bg-secondary' :
                          achievement.category === 'Bowling' ? 'bg-primary' :
                          achievement.category === 'Fielding' ? 'bg-green-500' :
                          achievement.category === 'All-Round' ? 'bg-yellow-500' :
                          achievement.category === 'Team' ? 'bg-purple-500' :
                          achievement.category === 'Career' ? 'bg-blue-500' :
                          achievement.category === 'Special' ? 'bg-amber-500' :
                          'bg-primary-light'
                        }`}>
                          {getAchievementIcon(achievement.category)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <h4 className="text-xl font-semibold">{achievement.title}</h4>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getTierStyles(achievement.tier)}`}>
                              {achievement.tier}
                            </span>
                          </div>
                          
                          <p className="mt-2 text-gray-700">{achievement.description}</p>
                          
                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-1">
                              <FaRegCalendarAlt className="text-gray-400" />
                              <span>{formatDate(achievement.achievementDate)}</span>
                            </div>
                            
                            {achievement.opponent && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">vs.</span>
                                <span>{achievement.opponent}</span>
                              </div>
                            )}
                            
                            {achievement.venue && (
                              <div className="flex items-center gap-1">
                                <FaMapMarkerAlt className="text-gray-400" />
                                <span>{achievement.venue}</span>
                              </div>
                            )}
                            
                            {achievement.value && (
                              <div className="flex items-center gap-1">
                                <FaChartBar className="text-gray-400" />
                                <span>{achievement.value}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <FaMedal className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No achievements yet</h3>
                    <p className="text-gray-500">Keep playing matches to earn achievements!</p>
                    <p className="text-sm text-gray-400 mt-2 mb-6">Achievements are awarded based on your performance in matches.</p>
                    <button 
                      onClick={() => {
                        setActiveTab('stats');
                        setTimeout(() => setIsStatsModalOpen(true), 100);
                      }}
                      className="btn btn-outline px-4 py-2 flex items-center gap-2 mx-auto"
                    >
                      <FaPlus />
                      Record Match Stats
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerProfile; 