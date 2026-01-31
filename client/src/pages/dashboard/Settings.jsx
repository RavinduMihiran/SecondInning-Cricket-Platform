import { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaLock, FaBell, FaShieldAlt, FaInfo, FaCamera, FaSpinner, FaKey } from 'react-icons/fa';
import { getCoachProfile, updateCoachProfile, uploadCoachProfileImage } from '../../services/coachService';
import { getCurrentPlayerProfile, updatePlayerProfile, uploadProfileImage } from '../../services/playerService';
import { changePassword } from '../../services/authService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import DistrictDropdown from '../../components/DistrictDropdown';
import { generateAccessCode } from '../../services/parentService';
import { Link } from 'react-router-dom';

const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  district: Yup.string()
    .required('District is required'),
  school: Yup.string()
    .required('School is required'),
  birthdate: Yup.date()
    .required('Birth date is required')
    .max(new Date(), 'Birth date cannot be in the future'),
  bio: Yup.string()
    .max(300, 'Bio cannot exceed 300 characters'),
});

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const NotificationSchema = Yup.object().shape({
  emailAlerts: Yup.boolean(),
  pushNotifications: Yup.boolean(),
  smsAlerts: Yup.boolean(),
  matchReminders: Yup.boolean(),
  systemUpdates: Yup.boolean(),
  marketingEmails: Yup.boolean(),
});

const Settings = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'player';
  const isCoach = userRole === 'coach' || userRole === 'scout';
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    school: '',
    birthdate: '',
    bio: '',
    profileImage: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [accessCode, setAccessCode] = useState(null);
  const [codeExpiry, setCodeExpiry] = useState(null);

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfileData();
    loadNotificationSettings();
    loadPrivacySettings();
  }, []);

  // Load notification settings from localStorage
  const loadNotificationSettings = () => {
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    
    // Default notification settings if none found
    return {
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    matchReminders: true,
    systemUpdates: true,
    marketingEmails: false,
  };
  };

  // Load privacy settings from localStorage
  const loadPrivacySettings = () => {
    try {
      const savedSettings = localStorage.getItem('privacySettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
    
    // Default privacy settings if none found
    return {
      profileVisibility: true,
      statsVisibility: true,
      mediaVisibility: true
    };
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the appropriate service based on user role
      const data = isCoach 
        ? await getCoachProfile() 
        : await getCurrentPlayerProfile();
      
      console.log('Profile data fetched:', data);
      console.log('Date of birth from API:', data.dateOfBirth);
      
      // Format date for input field (YYYY-MM-DD)
      let formattedDate = '';
      if (data.dateOfBirth) {
        try {
          // Create a Date object from the API date
          const dateObj = new Date(data.dateOfBirth);
          if (!isNaN(dateObj.getTime())) {
            // Format as YYYY-MM-DD for the date input
            formattedDate = dateObj.toISOString().split('T')[0];
            console.log('Date formatted successfully:', formattedDate);
          } else {
            console.error('Invalid date object created from API date:', data.dateOfBirth);
          }
        } catch (err) {
          console.error('Error formatting date from API:', err);
          formattedDate = '';
        }
      }
      
      console.log('Formatted date:', formattedDate);
      
      // Map fields based on user role
      if (isCoach) {
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          district: data.position || '', // Map position to district for display
          school: data.organization || '', // Map organization to school for display
          birthdate: formattedDate,
          bio: data.bio || '',
          profileImage: data.profileImage || ''
        });
      } else {
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          district: data.district || '',
          school: data.school || '',
          birthdate: formattedDate,
          bio: data.bio || '',
          profileImage: data.profileImage || ''
        });
      }
      
      setImagePreview(data.profileImage || '');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data. Please try again.');
      setLoading(false);
    }
  };

  // Notification settings
  const notificationSettings = useState(loadNotificationSettings)[0];
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState(loadPrivacySettings);

  const handleProfileSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true);
      
      console.log('Form values submitted:', values);
      console.log('Birthdate from form:', values.birthdate);
      
      // First handle image upload if there's a new image
      if (imageFile) {
        setUploading(true);
        try {
          console.log('Uploading profile image...');
          
          // Compress the image before uploading
          const compressedFile = await resizeAndCompressImage(imageFile);
          
          // Use the appropriate service based on user role
          if (isCoach) {
            await uploadCoachProfileImage(compressedFile);
          } else {
            await uploadProfileImage(compressedFile);
          }
          
          console.log('Profile image uploaded successfully');
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          toast.error('Failed to upload profile image');
        } finally {
          setUploading(false);
          setImageFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
      
      // Prepare common profile update data
      const commonProfileData = {
        name: values.name,
        phone: values.phone,
        bio: values.bio
      };
      
      // Add role-specific fields
      let profileUpdateData;
      if (isCoach) {
        // Coach-specific fields
        profileUpdateData = {
          ...commonProfileData,
          organization: values.school, // Map school field to organization for coaches
          position: values.district, // Map district field to position for coaches
        };
        
        // Handle date separately for coaches
        if (values.birthdate && values.birthdate.trim() !== '') {
          try {
            const dateObj = new Date(values.birthdate);
            if (!isNaN(dateObj.getTime())) {
              profileUpdateData.dateOfBirth = values.birthdate;
              console.log('Coach dateOfBirth being sent (raw):', values.birthdate);
            }
          } catch (err) {
            console.error('Error processing coach birthdate:', err);
          }
        }
      } else {
        // Player-specific fields
        profileUpdateData = {
          ...commonProfileData,
          school: values.school,
          district: values.district
        };
        
        // Handle date for players
        if (values.birthdate && values.birthdate.trim() !== '') {
          try {
            const dateObj = new Date(values.birthdate);
            if (!isNaN(dateObj.getTime())) {
              profileUpdateData.dateOfBirth = values.birthdate;
              console.log('Player dateOfBirth being sent:', values.birthdate);
            }
          } catch (err) {
            console.error('Error processing player birthdate:', err);
          }
        }
      }
      
      console.log('Updating profile with data:', profileUpdateData);
      
      // Update profile data using the appropriate service
      const updatedProfile = isCoach
        ? await updateCoachProfile(profileUpdateData)
        : await updatePlayerProfile(profileUpdateData);
      
      console.log('Profile updated:', updatedProfile);
      console.log('Updated dateOfBirth:', updatedProfile.dateOfBirth);
      
      // Update local state
      setProfileData(prevData => {
        // Format the date if it exists
        let formattedBirthdate = '';
        if (updatedProfile.dateOfBirth) {
          try {
            const dateObj = new Date(updatedProfile.dateOfBirth);
            if (!isNaN(dateObj.getTime())) {
              formattedBirthdate = dateObj.toISOString().split('T')[0];
            }
          } catch (err) {
            console.error('Error formatting returned date:', err);
          }
        }
        
        console.log('Setting new birthdate value:', formattedBirthdate);
        
        return {
          ...prevData,
          name: updatedProfile.name || prevData.name,
          email: updatedProfile.email || prevData.email,
          phone: updatedProfile.phone || prevData.phone,
          district: isCoach ? 
            (updatedProfile.position || prevData.district) : 
            (updatedProfile.district || prevData.district),
          school: isCoach ? 
            (updatedProfile.organization || prevData.school) : 
            (updatedProfile.school || prevData.school),
          birthdate: formattedBirthdate,
          bio: updatedProfile.bio || prevData.bio,
          profileImage: updatedProfile.profileImage || prevData.profileImage
        };
      });
      
      setSuccessMessage('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
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
          // Create a new file from the blob
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.4); // 40% quality JPEG
      };
    });
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
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

  const handlePasswordSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setSubmitting(true);
      
      // Call the changePassword API
      await changePassword(values.currentPassword, values.newPassword);
      
      // Show success message
      setSuccessMessage('Password updated successfully!');
      toast.success('Password updated successfully!');
      
      // Reset form
      resetForm();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error updating password:', error);
      
      // Show specific error message if available
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true);
      
      // Since there's no API endpoint yet, we'll save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(values));
      
      console.log('Notification settings updated:', values);
      setSuccessMessage('Notification preferences updated successfully!');
      toast.success('Notification preferences updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrivacySettingsChange = (setting, value) => {
    const updatedSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(updatedSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem('privacySettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const handleSavePrivacySettings = () => {
    // In a real app, this would be an API call
    
    // Show success message
    setSuccessMessage('Privacy settings updated successfully!');
    toast.success('Privacy settings updated successfully!');
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const handleGenerateAccessCode = async () => {
    try {
      setGeneratingCode(true);
      setError(null); // Clear any previous errors
      
      // Check if user has player role
      if (userRole !== 'player') {
        toast.error('Only players can generate access codes for parents');
        return;
      }
      
      console.log('Attempting to generate access code...');
      const response = await generateAccessCode();
      console.log('Generate access code response:', response);
      
      setAccessCode(response.accessCode);
      setCodeExpiry(new Date(response.expiresAt));
      
      toast.success('Access code generated successfully!');
    } catch (err) {
      console.error('Error generating access code:', err);
      
      // More specific error messages based on the error
      if (err.response) {
        if (err.response.status === 403) {
          setError('You do not have permission to generate access codes. Only players can generate access codes.');
          toast.error('Permission denied: Only players can generate access codes');
        } else if (err.response.data && err.response.data.message) {
          setError(`Server error: ${err.response.data.message}`);
          toast.error(err.response.data.message);
        } else {
          setError(`Server error (${err.response.status}): Unable to generate access code`);
          toast.error('Failed to generate access code. Please try again.');
        }
      } else if (err.request) {
        setError('Network error: Server not responding. Please check your connection.');
        toast.error('Network error. Please check your connection and try again.');
      } else {
        setError(`Error: ${err.message || 'Unknown error occurred'}`);
        toast.error('Failed to generate access code. Please try again.');
      }
    } finally {
      setGeneratingCode(false);
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
          {error}
        </div>
        <button 
          onClick={fetchProfileData}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex overflow-x-auto">
          <button
            className={`py-2 px-4 font-medium border-b-2 flex items-center ${
              activeTab === 'profile' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser className="mr-2" /> Profile
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 flex items-center ${
              activeTab === 'password' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('password')}
          >
            <FaLock className="mr-2" /> Password
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 flex items-center ${
              activeTab === 'notifications' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell className="mr-2" /> Notifications
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 flex items-center ${
              activeTab === 'privacy' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('privacy')}
          >
            <FaShieldAlt className="mr-2" /> Privacy
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 flex items-center ${
              activeTab === 'family' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('family')}
          >
            <FaKey className="mr-2" /> Family
          </button>
        </div>
      </div>
      
      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="card bg-white p-6">
          <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
          
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div 
              className="profile-image-container"
              onClick={handleImageClick}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile Preview" 
                  className="profile-image"
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
                className={`profile-image-placeholder ${imagePreview ? 'hidden' : ''}`}
              >
                {profileData.name ? (
                  <span className="profile-image-initials">
                    {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </span>
                ) : (
                  <FaUser className="text-gray-400 text-4xl" />
                )}
              </div>
              <div className="profile-image-upload-icon">
                {uploading ? <FaSpinner className="animate-spin" /> : <FaCamera />}
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
          
          <Formik
            initialValues={{
              name: profileData.name,
              email: profileData.email,
              phone: profileData.phone || '',
              district: profileData.district || '',
              school: profileData.school || '',
              birthdate: profileData.birthdate || '',
              bio: profileData.bio || ''
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleProfileSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="space-y-6">
                {/* Display success message if present */}
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
                    {successMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                      Full Name
                    </label>
                    <Field
                      type="text"
                      name="name"
                      id="name"
                      className="input w-full"
                      placeholder="Your full name"
                    />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                      Email Address
                    </label>
                    <Field
                      type="email"
                      name="email"
                      id="email"
                      className="input w-full bg-gray-100"
                      disabled={true}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Contact admin to change your email address
                    </div>
                  </div>

                  <div>
                    <label htmlFor="school" className="block text-gray-700 text-sm font-bold mb-2">
                      {isCoach ? 'Organization' : 'School'}
                    </label>
                    <Field
                      type="text"
                      name="school"
                      id="school"
                      className="input w-full"
                      placeholder={isCoach ? "Your organization" : "Your school"}
                    />
                    <ErrorMessage name="school" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label htmlFor="district" className="block text-gray-700 text-sm font-bold mb-2">
                      {isCoach ? 'Position' : 'District'}
                    </label>
                    {isCoach ? (
                      <Field
                        type="text"
                        name="district"
                        id="district"
                        className="input w-full"
                        placeholder="Your position"
                      />
                    ) : (
                      <DistrictDropdown
                        name="district"
                        id="district"
                        value={values.district}
                        onChange={(e) => setFieldValue('district', e.target.value)}
                        className="w-full"
                      />
                    )}
                    <ErrorMessage name="district" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                      Phone Number
                    </label>
                    <Field
                      type="tel"
                      name="phone"
                      id="phone"
                      className="input w-full"
                      placeholder="Your phone number"
                    />
                    <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label htmlFor="birthdate" className="block text-gray-700 text-sm font-bold mb-2">
                      Birth Date
                    </label>
                    <Field
                      type="date"
                      name="birthdate"
                      id="birthdate"
                      className="input w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Format: YYYY-MM-DD
                    </div>
                    <ErrorMessage name="birthdate" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
                    Bio
                  </label>
                  <Field
                    as="textarea"
                    name="bio"
                    id="bio"
                    rows="4"
                    className="input w-full"
                    placeholder="Tell us about yourself"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {values.bio ? values.bio.length : 0}/300 characters
                  </div>
                  <ErrorMessage name="bio" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || uploading}
                  >
                    {isSubmitting || uploading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
      
      {/* Password Settings */}
      {activeTab === 'password' && (
        <div className="card bg-white p-6">
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>
          
          <Formik
            initialValues={{
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }}
            validationSchema={PasswordSchema}
            onSubmit={handlePasswordSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="currentPassword" className="label">Current Password</label>
                  <Field 
                    type="password" 
                    id="currentPassword" 
                    name="currentPassword" 
                    className="input"
                  />
                  <ErrorMessage name="currentPassword" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="label">New Password</label>
                  <Field 
                    type="password" 
                    id="newPassword" 
                    name="newPassword" 
                    className="input"
                  />
                  <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                  <Field 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    className="input"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
      
      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="card bg-white p-6">
          <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
          
          <Formik
            initialValues={notificationSettings}
            validationSchema={NotificationSchema}
            onSubmit={handleNotificationSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <Field 
                        type="checkbox" 
                        id="emailAlerts" 
                        name="emailAlerts" 
                        className="h-4 w-4 text-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="emailAlerts" className="font-medium text-gray-700">Email Alerts</label>
                      <p className="text-gray-500">Receive notifications via email</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <Field 
                        type="checkbox" 
                        id="pushNotifications" 
                        name="pushNotifications" 
                        className="h-4 w-4 text-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="pushNotifications" className="font-medium text-gray-700">Push Notifications</label>
                      <p className="text-gray-500">Receive notifications on your device</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <Field 
                        type="checkbox" 
                        id="smsAlerts" 
                        name="smsAlerts" 
                        className="h-4 w-4 text-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="smsAlerts" className="font-medium text-gray-700">SMS Alerts</label>
                      <p className="text-gray-500">Receive notifications via SMS</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Notification Types</h3>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <Field 
                          type="checkbox" 
                          id="matchReminders" 
                          name="matchReminders" 
                          className="h-4 w-4 text-primary border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="matchReminders" className="font-medium text-gray-700">Match Reminders</label>
                        <p className="text-gray-500">Get notifications about upcoming matches</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start mt-4">
                      <div className="flex items-center h-5">
                        <Field 
                          type="checkbox" 
                          id="systemUpdates" 
                          name="systemUpdates" 
                          className="h-4 w-4 text-primary border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="systemUpdates" className="font-medium text-gray-700">System Updates</label>
                        <p className="text-gray-500">Important updates about the platform</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start mt-4">
                      <div className="flex items-center h-5">
                        <Field 
                          type="checkbox" 
                          id="marketingEmails" 
                          name="marketingEmails" 
                          className="h-4 w-4 text-primary border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="marketingEmails" className="font-medium text-gray-700">Marketing Emails</label>
                        <p className="text-gray-500">Receive promotional content and offers</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
      
      {/* Privacy Settings */}
      {activeTab === 'privacy' && (
        <div className="card bg-white p-6">
          <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Profile Visibility</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Public Profile</h4>
                    <p className="text-sm text-gray-500">Allow anyone to view your profile</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 ml-2">
                    <input 
                      type="checkbox" 
                      id="profile-visibility" 
                      className="opacity-0 w-0 h-0"
                      checked={privacySettings.profileVisibility}
                      onChange={(e) => handlePrivacySettingsChange('profileVisibility', e.target.checked)}
                    />
                    <label 
                      htmlFor="profile-visibility" 
                      className="block absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-primary"
                    ></label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Stats Visibility</h4>
                    <p className="text-sm text-gray-500">Allow coaches and scouts to view your statistics</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 ml-2">
                    <input 
                      type="checkbox" 
                      id="stats-visibility" 
                      className="opacity-0 w-0 h-0"
                      checked={privacySettings.statsVisibility}
                      onChange={(e) => handlePrivacySettingsChange('statsVisibility', e.target.checked)}
                    />
                    <label 
                      htmlFor="stats-visibility" 
                      className="block absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-primary"
                    ></label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Media Visibility</h4>
                    <p className="text-sm text-gray-500">Allow your videos and images to be visible to others</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 ml-2">
                    <input 
                      type="checkbox" 
                      id="media-visibility" 
                      className="opacity-0 w-0 h-0"
                      checked={privacySettings.mediaVisibility}
                      onChange={(e) => handlePrivacySettingsChange('mediaVisibility', e.target.checked)}
                    />
                    <label 
                      htmlFor="media-visibility" 
                      className="block absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-primary"
                    ></label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Data Management</h3>
              <div className="space-y-4">
                <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                  <FaInfo className="mr-2" /> 
                  Request a copy of your data
                </button>
                <button className="text-red-600 hover:text-red-700 text-sm flex items-center">
                  <FaShieldAlt className="mr-2" /> 
                  Delete account
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button 
              className="btn btn-primary"
              onClick={handleSavePrivacySettings}
            >
              Save Privacy Settings
            </button>
          </div>
        </div>
      )}
      
      {/* Family Settings */}
      {activeTab === 'family' && (
        <div className="space-y-6">
          <div className="card p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Parent Access</h3>
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-sm text-blue-700">
                {userRole === 'player' ? (
                  'Generate an access code to allow your parent or guardian to link their account to your profile. They will be able to view your stats, achievements, and coach feedback.'
                ) : userRole === 'parent' ? (
                  'As a parent, you can link to your child\'s profile using an access code. Ask your child to generate an access code from their profile settings.'
                ) : (
                  'Only players can generate access codes for parent linking.'
                )}
              </p>
            </div>
            
            {/* Display error message if there is one */}
            {error && (
              <div className="bg-red-50 p-4 rounded-md mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {accessCode ? (
              <div className="bg-green-50 p-4 rounded-md mb-4">
                <h4 className="font-medium text-green-800 mb-2">Access Code Generated</h4>
                <div className="flex items-center justify-center mb-2">
                  <div className="bg-white px-4 py-2 rounded-md border border-green-300 text-2xl font-mono tracking-widest">
                    {accessCode}
                  </div>
                </div>
                <p className="text-sm text-green-700 text-center mb-2">
                  Share this code with your parent/guardian
                </p>
                <p className="text-xs text-green-600 text-center">
                  Expires: {codeExpiry?.toLocaleString() || 'in 7 days'}
                </p>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(accessCode);
                      toast.success('Access code copied to clipboard!');
                    }}
                    className="btn btn-sm btn-outline"
                  >
                    Copy Code
                  </button>
                </div>
              </div>
            ) : userRole === 'player' ? (
              <button
                onClick={handleGenerateAccessCode}
                disabled={generatingCode}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                {generatingCode ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaKey className="mr-2" />
                    Generate Access Code
                  </>
                )}
              </button>
            ) : userRole === 'parent' ? (
              <div className="text-center">
                <Link to="/dashboard/parent/link-child" className="btn btn-primary">
                  Link to Child
                </Link>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>This feature is only available for players and parents.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 