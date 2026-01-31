import { useState, useEffect } from 'react';
import { FaShieldAlt, FaSpinner, FaSave, FaEye, FaEyeSlash, FaLock, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const Security = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiryDays: 90,
    },
    loginSecurity: {
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      twoFactorAuth: false,
      requireEmailVerification: true,
    },
    sessionSecurity: {
      sessionTimeout: 60, // minutes
      rememberMeDuration: 30, // days
      enforceSSL: true,
    }
  });
  
  const [securityLogs, setSecurityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Fetch security settings and logs on component mount
  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        setLoading(true);
        // In a real implementation, these would be fetched from the server
        // const settingsResponse = await axios.get('/api/admin/security/settings');
        // const logsResponse = await axios.get('/api/admin/security/logs');
        // setSecuritySettings(settingsResponse.data);
        // setSecurityLogs(logsResponse.data);
        
        // For now, we'll use the default settings and mock logs
        const mockLogs = [
          { id: 1, type: 'login_success', user: 'admin', ip: '192.168.1.1', userAgent: 'Chrome/98.0.4758.102', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { id: 2, type: 'login_failed', user: 'unknown', ip: '203.0.113.1', userAgent: 'Firefox/97.0', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: 3, type: 'password_changed', user: 'admin', ip: '192.168.1.1', userAgent: 'Chrome/98.0.4758.102', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
          { id: 4, type: 'login_failed', user: 'coach1', ip: '198.51.100.1', userAgent: 'Safari/15.3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
          { id: 5, type: 'account_locked', user: 'coach1', ip: '198.51.100.1', userAgent: 'Safari/15.3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3 - 1000).toISOString() },
          { id: 6, type: 'login_success', user: 'scout1', ip: '203.0.113.5', userAgent: 'Edge/98.0.1108.56', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
          { id: 7, type: 'login_success', user: 'player1', ip: '192.0.2.1', userAgent: 'Mobile Chrome/98.0.4758.101', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
        ];
        
        setSecurityLogs(mockLogs);
        
        // Simulate API call delay
        setTimeout(() => {
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching security data:', error);
        toast.error('Failed to load security settings');
        setLoading(false);
      }
    };
    
    fetchSecurityData();
  }, []);

  // Handle input changes for security settings
  const handleSettingChange = (section, name, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e, section) => {
    const { name, checked } = e.target;
    handleSettingChange(section, name, checked);
  };

  // Handle number input changes
  const handleNumberChange = (e, section) => {
    const { name, value } = e.target;
    handleSettingChange(section, name, parseInt(value, 10));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // In a real implementation, this would save to the server
      // await axios.put('/api/admin/security/settings', securitySettings);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Security settings saved successfully');
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  // Format log type for display
  const formatLogType = (type) => {
    switch (type) {
      case 'login_success':
        return { label: 'Login Success', icon: <FaLock className="text-green-500" /> };
      case 'login_failed':
        return { label: 'Login Failed', icon: <FaExclamationTriangle className="text-yellow-500" /> };
      case 'password_changed':
        return { label: 'Password Changed', icon: <FaLock className="text-blue-500" /> };
      case 'account_locked':
        return { label: 'Account Locked', icon: <FaExclamationTriangle className="text-red-500" /> };
      default:
        return { label: type.replace('_', ' '), icon: <FaHistory className="text-gray-500" /> };
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading security settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Security Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <FaShieldAlt className="inline-block mr-2" />
            Security Settings
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <FaHistory className="inline-block mr-2" />
            Security Logs
          </button>
        </nav>
      </div>

      {activeTab === 'settings' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Policy */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Password Policy</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="minLength" className="block text-sm font-medium text-gray-300 mb-1">Minimum Password Length</label>
                <input
                  type="number"
                  id="minLength"
                  name="minLength"
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) => handleNumberChange(e, 'passwordPolicy')}
                  min="6"
                  max="32"
                  className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="passwordExpiryDays" className="block text-sm font-medium text-gray-300 mb-1">Password Expiry (Days)</label>
                <input
                  type="number"
                  id="passwordExpiryDays"
                  name="passwordExpiryDays"
                  value={securitySettings.passwordPolicy.passwordExpiryDays}
                  onChange={(e) => handleNumberChange(e, 'passwordPolicy')}
                  min="0"
                  max="365"
                  className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Set to 0 for no expiration
                </div>
              </div>
              
              <div className="form-group flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireUppercase"
                    checked={securitySettings.passwordPolicy.requireUppercase}
                    onChange={(e) => handleCheckboxChange(e, 'passwordPolicy')}
                    className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">Require Uppercase Letters</span>
                </label>
              </div>
              
              <div className="form-group flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireLowercase"
                    checked={securitySettings.passwordPolicy.requireLowercase}
                    onChange={(e) => handleCheckboxChange(e, 'passwordPolicy')}
                    className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">Require Lowercase Letters</span>
                </label>
              </div>
              
              <div className="form-group flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireNumbers"
                    checked={securitySettings.passwordPolicy.requireNumbers}
                    onChange={(e) => handleCheckboxChange(e, 'passwordPolicy')}
                    className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">Require Numbers</span>
                </label>
              </div>
              
              <div className="form-group flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireSpecialChars"
                    checked={securitySettings.passwordPolicy.requireSpecialChars}
                    onChange={(e) => handleCheckboxChange(e, 'passwordPolicy')}
                    className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">Require Special Characters</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Login Security */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Login Security</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="maxLoginAttempts" className="block text-sm font-medium text-gray-300 mb-1">Max Login Attempts</label>
                <input
                  type="number"
                  id="maxLoginAttempts"
                  name="maxLoginAttempts"
                  value={securitySettings.loginSecurity.maxLoginAttempts}
                  onChange={(e) => handleNumberChange(e, 'loginSecurity')}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lockoutDuration" className="block text-sm font-medium text-gray-300 mb-1">Lockout Duration (Minutes)</label>
                <input
                  type="number"
                  id="lockoutDuration"
                  name="lockoutDuration"
                  value={securitySettings.loginSecurity.lockoutDuration}
                  onChange={(e) => handleNumberChange(e, 'loginSecurity')}
                  min="5"
                  max="1440"
                  className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="form-group flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={securitySettings.loginSecurity.twoFactorAuth}
                    onChange={(e) => handleCheckboxChange(e, 'loginSecurity')}
                    className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">Enable Two-Factor Authentication</span>
                </label>
              </div>
              
              <div className="form-group flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    checked={securitySettings.loginSecurity.requireEmailVerification}
                    onChange={(e) => handleCheckboxChange(e, 'loginSecurity')}
                    className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">Require Email Verification</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Session Security */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Session Security</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-300 mb-1">Session Timeout (Minutes)</label>
                <input
                  type="number"
                  id="sessionTimeout"
                  name="sessionTimeout"
                  value={securitySettings.sessionSecurity.sessionTimeout}
                  onChange={(e) => handleNumberChange(e, 'sessionSecurity')}
                  min="5"
                  max="1440"
                  className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="rememberMeDuration" className="block text-sm font-medium text-gray-300 mb-1">Remember Me Duration (Days)</label>
                <input
                  type="number"
                  id="rememberMeDuration"
                  name="rememberMeDuration"
                  value={securitySettings.sessionSecurity.rememberMeDuration}
                  onChange={(e) => handleNumberChange(e, 'sessionSecurity')}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="form-group flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="enforceSSL"
                    checked={securitySettings.sessionSecurity.enforceSSL}
                    onChange={(e) => handleCheckboxChange(e, 'sessionSecurity')}
                    className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="ml-2 text-gray-300">Enforce SSL</span>
                </label>
                <div className="text-xs text-gray-400 mt-1 ml-6">
                  Require secure HTTPS connections for all users
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
                  Save Security Settings
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {securityLogs.length > 0 ? (
                  securityLogs.map((log) => {
                    const { label, icon } = formatLogType(log.type);
                    return (
                      <tr key={log.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2">{icon}</span>
                            <span className="text-sm font-medium text-gray-200">{label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {log.user}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {log.ip}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {log.userAgent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatTimestamp(log.timestamp)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                      No security logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security; 