import { useState, useEffect, useRef } from 'react';
import { FaUser, FaCamera, FaBuilding, FaBriefcase, FaPhone, FaEnvelope, FaGraduationCap, FaSpinner, FaTimes, FaCheck, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaLock, FaBell, FaShieldAlt, FaBug, FaMapMarkerAlt } from 'react-icons/fa';
import { getCoachProfile, updateCoachProfile, uploadCoachProfileImage } from '../../../services/coachService';
import { toast } from 'react-toastify';
import { sriLankaDistricts } from '../../../utils/districtUtils';
import DistrictDropdown from '../../../components/DistrictDropdown';
import SriLankaDistrictMap from '../../../components/SriLankaDistrictMap';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    position: '',
    bio: '',
    phone: '',
    experience: '',
    specialization: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    district: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Fetch coach profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Separate fetchProfile function for reuse
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCoachProfile();
      setProfile(data);
      
      // Initialize form with profile data
      setFormData({
        name: data.name || '',
        organization: data.organization || '',
        position: data.position || '',
        bio: data.bio || '',
        phone: data.phone || '',
        experience: data.experience || '',
        specialization: data.specialization || '',
        socialMedia: {
          facebook: data.socialMedia?.facebook || '',
          twitter: data.socialMedia?.twitter || '',
          instagram: data.socialMedia?.instagram || '',
          linkedin: data.socialMedia?.linkedin || ''
        },
        district: data.district || ''
      });
      
      setImagePreview(data.profileImage || '');
    } catch (error) {
      console.error('Error fetching coach profile:', error);
      setError('Failed to load profile data. Please try again.');
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Form change:', name, value);
    
    if (name.includes('.')) {
      // Handle nested objects (social media)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      console.log('Updated formData for', name, ':', value);
    }
  };

  // Handle profile image selection
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
        
        // Calculate new dimensions (max 400px width/height)
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
        }, 'image/jpeg', 0.4); // 40% quality JPEG
      };
    });
  };

  // Save profile changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate district selection
    if (!formData.district) {
      toast.warning('Please select your district before saving changes');
      // Scroll to the district section
      document.querySelector('.district-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setSaving(true);

    try {
      // First, handle image upload if there's a new image
      if (imageFile) {
        try {
          console.log('Processing image file:', imageFile.name, 'size:', imageFile.size);
          
          // Compress the image first
          const compressedBlob = await resizeAndCompressImage(imageFile);
          console.log('Image compressed, new size:', compressedBlob.size);
          
          // Create a file from the blob
          const compressedFile = new File([compressedBlob], imageFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          console.log('Compressed file created, size:', compressedFile.size);
          
          // Upload the image
          const imageResult = await uploadCoachProfileImage(compressedFile);
          console.log('Image upload completed, result:', imageResult);
          
          // Clear the file input after successful upload
          setImageFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          toast.error('Failed to upload profile image');
          // Continue with profile update even if image upload fails
        }
      }

      // Then update profile data
      console.log('Updating profile data:', formData);
      console.log('District being sent:', formData.district);
      const updatedProfile = await updateCoachProfile(formData);
      console.log('Profile update completed, result:', updatedProfile);
      console.log('District in response:', updatedProfile.district);
      
      // Update local state with the response
      setProfile(updatedProfile);
      setImagePreview(updatedProfile.profileImage || '');
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Debug function to test image upload
  const handleDebugImageUpload = async () => {
    try {
      // Create a simple canvas with text
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = '#3498db';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Test Image', canvas.width / 2, canvas.height / 2);
      ctx.fillText(new Date().toISOString(), canvas.width / 2, canvas.height / 2 + 30);
      
      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      
      // Create file from blob
      const testFile = new File([blob], 'test-image.jpg', { type: 'image/jpeg', lastModified: Date.now() });
      console.log('Created test image file:', testFile.name, 'size:', testFile.size);
      
      // Set as current image file
      setImageFile(testFile);
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        console.log('Image preview set');
        toast.info('Test image created. Click Save Changes to upload it.');
      };
      reader.readAsDataURL(testFile);
    } catch (error) {
      console.error('Error creating test image:', error);
      toast.error('Failed to create test image');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 text-xl mb-4">
          <FaTimes className="inline-block mr-2" />
          {error}
        </div>
        <button 
          onClick={fetchProfile}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Debug button - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <button
          type="button"
          onClick={handleDebugImageUpload}
          className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50"
          title="Create test image"
        >
          <FaBug />
        </button>
      )}
      
      {/* Settings Tabs */}
      <div className="mb-6 border-b">
        <div className="flex overflow-x-auto">
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === 'profile' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser className="inline mr-2" />
            Profile
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === 'password' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('password')}
          >
            <FaLock className="inline mr-2" />
            Password
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === 'notifications' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell className="inline mr-2" />
            Notifications
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === 'privacy' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('privacy')}
          >
            <FaShieldAlt className="inline mr-2" />
            Privacy
          </button>
        </div>
      </div>

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="card bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
              <div 
                className="relative cursor-pointer"
                onClick={handleImageClick}
              >
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile Preview" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-light"
                    onError={(e) => {
                      console.log('Image failed to load, showing initials');
                      e.target.style.display = 'none';
                      // Find the next sibling (the initials div) and show it
                      const initialsDiv = e.target.nextSibling;
                      if (initialsDiv) {
                        initialsDiv.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center ${imagePreview ? 'hidden' : ''}`}
                >
                  {formData.name ? (
                    <span className="text-gray-600 text-3xl font-bold">
                      {formData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </span>
                  ) : (
                    <FaUser className="text-gray-400 text-4xl" />
                  )}
                </div>
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

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    className="input w-full pl-10 bg-gray-50"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Organization
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Your organization"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Position
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBriefcase className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Your position (e.g., Head Coach)"
                  />
                </div>
              </div>

              {/* District Information Section */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 district-section">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  District Information
                  {!formData.district && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-blue-700 mb-4">
                      Select your coaching district in Sri Lanka. This helps players and other coaches find you based on your location.
                    </p>
                    
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Your District
                    </label>
                    
                    <DistrictDropdown
                      name="district"
                      value={formData.district || ''}
                      onChange={handleChange}
                      placeholder="Select your district"
                      className="w-full"
                    />
                    
                    {formData.district && (
                      <div className="mt-4 p-3 bg-white rounded-md shadow-sm">
                        <p className="font-medium text-gray-800">
                          Selected: {formData.district}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          You will appear in searches for coaches in {formData.district} district.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="aspect-w-16 aspect-h-9 mb-3">
                      <SriLankaDistrictMap selectedDistrict={formData.district} />
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Sri Lanka has 24 administrative districts across 9 provinces
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Experience (years)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Years of experience"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Specialization
                </label>
                <div className="relative">
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="input w-full pl-3"
                  >
                    <option value="">Select specialization</option>
                    <option value="batting">Batting</option>
                    <option value="bowling">Bowling</option>
                    <option value="fielding">Fielding</option>
                    <option value="fitness">Fitness & Conditioning</option>
                    <option value="strategy">Strategy & Tactics</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input w-full h-32"
                placeholder="Tell us about yourself, your coaching philosophy, and achievements"
                maxLength="500"
              ></textarea>
              <div className="text-xs text-gray-500 text-right mt-1">
                {formData.bio.length}/500 characters
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-medium mb-4">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Facebook
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFacebook className="text-blue-600" />
                    </div>
                    <input
                      type="text"
                      name="socialMedia.facebook"
                      value={formData.socialMedia.facebook}
                      onChange={handleChange}
                      className="input w-full pl-10"
                      placeholder="Facebook profile URL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Twitter
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaTwitter className="text-blue-400" />
                    </div>
                    <input
                      type="text"
                      name="socialMedia.twitter"
                      value={formData.socialMedia.twitter}
                      onChange={handleChange}
                      className="input w-full pl-10"
                      placeholder="Twitter profile URL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Instagram
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaInstagram className="text-pink-600" />
                    </div>
                    <input
                      type="text"
                      name="socialMedia.instagram"
                      value={formData.socialMedia.instagram}
                      onChange={handleChange}
                      className="input w-full pl-10"
                      placeholder="Instagram profile URL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    LinkedIn
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLinkedin className="text-blue-700" />
                    </div>
                    <input
                      type="text"
                      name="socialMedia.linkedin"
                      value={formData.socialMedia.linkedin}
                      onChange={handleChange}
                      className="input w-full pl-10"
                      placeholder="LinkedIn profile URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>
          
          <form className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  className="input w-full pl-10"
                  placeholder="Enter your current password"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  className="input w-full pl-10"
                  placeholder="Enter new password"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  className="input w-full pl-10"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Player Updates</p>
                    <p className="text-sm text-gray-500">Receive updates when players in your watchlist update their profiles</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Achievements</p>
                    <p className="text-sm text-gray-500">Get notified when players earn new achievements</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Announcements</p>
                    <p className="text-sm text-gray-500">Important updates about the platform</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">In-App Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Player Activity</p>
                    <p className="text-sm text-gray-500">Get notified about player activities in your watchlist</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Feedback Responses</p>
                    <p className="text-sm text-gray-500">Get notified when players respond to your feedback</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="card bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Profile Visibility</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Email Address</p>
                    <p className="text-sm text-gray-500">Allow players to see your email address</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Phone Number</p>
                    <p className="text-sm text-gray-500">Allow players to see your phone number</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Social Media Links</p>
                    <p className="text-sm text-gray-500">Display your social media profiles to players</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary"
              >
                Save Privacy Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 