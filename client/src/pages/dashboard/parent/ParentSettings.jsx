import { useState, useEffect, useContext } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaSpinner } from 'react-icons/fa';
import { AuthContext } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name is too short')
    .max(50, 'Name is too long')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .nullable(),
  bio: Yup.string()
    .max(500, 'Bio cannot be more than 500 characters')
    .nullable()
});

const ParentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });
  
  const { user, updateUserProfile } = useContext(AuthContext);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current user profile
        const response = await axios.get('/api/auth/me');
        
        setProfileData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          bio: response.data.bio || ''
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Handle profile update
  const handleProfileSubmit = async (values, { setSubmitting }) => {
    try {
      setSaving(true);
      
      // Update user profile
      const response = await axios.put('/api/auth/profile', {
        name: values.name,
        phone: values.phone,
        bio: values.bio
      });
      
      // Update context
      updateUserProfile(response.data);
      
      setProfileData({
        ...profileData,
        name: response.data.name,
        phone: response.data.phone,
        bio: response.data.bio
      });
      
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Settings</h1>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
          
          <Formik
            initialValues={profileData}
            validationSchema={ProfileSchema}
            onSubmit={handleProfileSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Field
                    type="text"
                    name="name"
                    className="input w-full"
                    placeholder="Your name"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Field
                    type="email"
                    name="email"
                    className="input w-full bg-gray-100"
                    disabled={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Field
                    type="text"
                    name="phone"
                    className="input w-full"
                    placeholder="Your phone number"
                  />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <Field
                    as="textarea"
                    name="bio"
                    className="input w-full h-32"
                    placeholder="Tell us a bit about yourself"
                  />
                  <ErrorMessage name="bio" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || saving}
                  >
                    {(isSubmitting || saving) ? (
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
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          
          <div className="bg-yellow-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800">Password Change</h3>
            <p className="text-xs text-yellow-700 mt-1">
              To change your password, please use the "Forgot Password" option on the login page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSettings; 