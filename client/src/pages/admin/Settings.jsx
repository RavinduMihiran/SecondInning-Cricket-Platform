import { useState, useEffect } from 'react';
import { FaCog, FaSpinner, FaSave, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'SecondInning Cricket',
    siteDescription: 'Cricket player development and scouting platform',
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    defaultUserRole: 'player',
    maxUploadSize: 10, // in MB
    mediaApprovalRequired: true,
    analyticsEnabled: true,
    theme: 'default'
  });
  
  // Themes available in the system
  const availableThemes = [
    { id: 'default', name: 'Default Blue' },
    { id: 'dark', name: 'Dark Mode' },
    { id: 'light', name: 'Light Mode' },
    { id: 'cricket', name: 'Cricket Green' }
  ];
  
  // User roles available for default selection
  const userRoles = [
    { id: 'player', name: 'Player' },
    { id: 'coach', name: 'Coach' },
    { id: 'scout', name: 'Scout' },
    { id: 'parent', name: 'Parent' }
  ];

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be fetched from the server
        // const response = await axios.get('/api/admin/settings');
        // setSettings(response.data);
        
        // For now, we'll use the default settings and simulate a delay
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // In a real implementation, this would save to the server
      // await axios.put('/api/admin/settings', settings);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">General Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-300 mb-1">Site Name</label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-300 mb-1">Site Description</label>
              <input
                type="text"
                id="siteDescription"
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
              <select
                id="theme"
                name="theme"
                value={settings.theme}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="defaultUserRole" className="block text-sm font-medium text-gray-300 mb-1">Default User Role</label>
              <select
                id="defaultUserRole"
                name="defaultUserRole"
                value={settings.defaultUserRole}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {userRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* System Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">System Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-gray-300">Maintenance Mode</span>
              </label>
              <div className="text-xs text-gray-400 mt-1 ml-6">
                When enabled, the site will display a maintenance message to users.
              </div>
            </div>
            
            <div className="form-group flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-gray-300">Allow User Registration</span>
              </label>
              <div className="text-xs text-gray-400 mt-1 ml-6">
                When disabled, new users cannot register on the platform.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="maxUploadSize" className="block text-sm font-medium text-gray-300 mb-1">Max Upload Size (MB)</label>
              <input
                type="number"
                id="maxUploadSize"
                name="maxUploadSize"
                value={settings.maxUploadSize}
                onChange={handleNumberChange}
                min="1"
                max="100"
                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                Maximum file size for media uploads in megabytes.
              </div>
            </div>
            
            <div className="form-group flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="mediaApprovalRequired"
                  checked={settings.mediaApprovalRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-gray-300">Require Media Approval</span>
              </label>
              <div className="text-xs text-gray-400 mt-1 ml-6">
                When enabled, uploaded media requires admin approval before being visible.
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-gray-300">Email Notifications</span>
              </label>
              <div className="text-xs text-gray-400 mt-1 ml-6">
                Send email notifications for important system events.
              </div>
            </div>
            
            <div className="form-group flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="analyticsEnabled"
                  checked={settings.analyticsEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-gray-300">Enable Analytics</span>
              </label>
              <div className="text-xs text-gray-400 mt-1 ml-6">
                Collect usage data to improve the platform.
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center transition-colors"
            disabled={saving}
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings; 