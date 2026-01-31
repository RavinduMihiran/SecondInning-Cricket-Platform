import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiServer, FiHardDrive, FiDatabase, FiDownload, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SystemManagement = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSystemStatus();
    fetchBackups();
  }, []);

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/system-status');
      console.log('System status data:', response.data);
      setSystemStatus(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching system status:', error);
      setError('Failed to load system status');
      toast.error('Failed to load system status');
    } finally {
      setLoading(false);
    }
  };

  // This would be replaced with a real API call in production
  const fetchBackups = async () => {
    try {
      // Since we don't have a real backup API endpoint yet, we'll use mock data
      // In a real application, you would fetch this data from the server
      const mockBackups = [
        {
          id: 'backup-1684512000000',
          timestamp: new Date(2023, 4, 19, 10, 0, 0),
          size: 25600000,
          status: 'completed',
          files: ['users.bson', 'media.bson', 'stats.bson', 'announcements.bson']
        },
        {
          id: 'backup-1684425600000',
          timestamp: new Date(2023, 4, 18, 10, 0, 0),
          size: 24800000,
          status: 'completed',
          files: ['users.bson', 'media.bson', 'stats.bson', 'announcements.bson']
        }
      ];
      
      setBackups(mockBackups);
      
      // NOTE: In production, you would use code like this:
      // const response = await api.get('/api/admin/backups');
      // setBackups(response.data);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to load backup history');
    }
  };

  const handleCreateBackup = async () => {
    setBackupInProgress(true);
    try {
      const response = await api.post('/api/admin/backup');
      toast.success('Backup created successfully');
      
      // Add the new backup to the list
      setBackups([response.data.backup, ...backups]);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleDownloadBackup = (backupId) => {
    // In a real application, this would trigger a download
    toast.info(`Downloading backup ${backupId}...`);
    // Simulating a download - in production this would be a real download request
    setTimeout(() => {
      toast.success('Backup downloaded successfully');
    }, 2000);
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format uptime to human-readable format
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading && !systemStatus) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">System Management</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertCircle className="mr-2 text-red-400" size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* System Status */}
      {systemStatus && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FiServer className="mr-2" /> System Status
            </h2>
            <button 
              onClick={fetchSystemStatus}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full"
              title="Refresh Status"
            >
              <FiRefreshCw className="text-blue-400" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-300 font-medium">Status</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  systemStatus.status === 'operational' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {systemStatus.status === 'operational' ? 'Operational' : 'Issues Detected'}
                </span>
              </div>
              <div className="text-gray-400 text-sm">
                <p>Uptime: {formatUptime(systemStatus.uptime)}</p>
                <p>Last Updated: {new Date(systemStatus.timestamp).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FiDatabase className="mr-2 text-blue-400" />
                <h3 className="text-gray-300 font-medium">Database</h3>
              </div>
              <div className="text-gray-400 text-sm">
                <p>Status: {systemStatus.services.database.status}</p>
                <p>Response Time: {systemStatus.services.database.responseTime}ms</p>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FiHardDrive className="mr-2 text-purple-400" />
                <h3 className="text-gray-300 font-medium">Storage</h3>
              </div>
              <div className="text-gray-400 text-sm">
                <p>Status: {systemStatus.services.fileStorage.status}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Used: {formatBytes(systemStatus.services.fileStorage.usedSpace)}</span>
                    <span>Total: {formatBytes(systemStatus.services.fileStorage.totalSpace)}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(systemStatus.services.fileStorage.usedSpace / systemStatus.services.fileStorage.totalSpace) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Memory Usage */}
      {systemStatus && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Memory Usage</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(systemStatus.memoryUsage).map(([key, value]) => (
              <div key={key} className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-300 font-medium capitalize mb-2">{key}</h3>
                <p className="text-2xl font-bold text-blue-400">{formatBytes(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Backup Management */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Backup Management</h2>
          <button 
            onClick={handleCreateBackup}
            disabled={backupInProgress}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {backupInProgress ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <FiDownload className="mr-2" />
                Create Backup
              </>
            )}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-600">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{backup.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {backup.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatBytes(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      backup.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleDownloadBackup(backup.id)}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              
              {backups.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                    No backups available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemManagement; 