import { useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import { FaWifi, FaExclamationTriangle, FaSync } from 'react-icons/fa';

const ConnectionStatus = ({ className = '', minimal = false }) => {
  const { isConnected, connectionError, connectionAttempts, lastConnected, reconnect } = useContext(SocketContext);

  // Format last connected time
  const formatLastConnected = () => {
    if (!lastConnected) return 'Never';
    
    const now = new Date();
    const diffMs = now - lastConnected;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return lastConnected.toLocaleString();
  };

  // Minimal version (just icon and basic status)
  if (minimal) {
    return (
      <div className={`flex items-center ${className}`}>
        {isConnected ? (
          <span className="flex items-center text-green-600 text-xs">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
            Live
          </span>
        ) : (
          <span className="flex items-center text-gray-500 text-xs">
            <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
            Offline
          </span>
        )}
      </div>
    );
  }

  // Full version with detailed status and reconnect button
  return (
    <div className={`rounded-md ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isConnected ? (
            <>
              <FaWifi className="text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-700">Connected</span>
              <span className="h-2 w-2 rounded-full bg-green-500 ml-2 animate-pulse"></span>
            </>
          ) : (
            <>
              <FaExclamationTriangle className="text-orange-500 mr-2" />
              <span className="text-sm font-medium text-orange-700">
                {connectionAttempts > 0 
                  ? `Reconnecting (${connectionAttempts})...` 
                  : 'Disconnected'}
              </span>
            </>
          )}
        </div>
        
        {!isConnected && (
          <button 
            onClick={reconnect}
            className="ml-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
            title="Reconnect"
          >
            <FaSync className={`h-3 w-3 ${connectionAttempts > 0 ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      {!minimal && (
        <div className="mt-1 text-xs text-gray-500">
          {connectionError ? (
            <span className="text-red-500">Error: {connectionError}</span>
          ) : (
            <>Last connected: {formatLastConnected()}</>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 