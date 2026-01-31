import { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const SocketDebug = () => {
  const { socket, isConnected, reconnect, testConnection } = useContext(SocketContext);
  const { currentUser } = useContext(AuthContext);
  const [status, setStatus] = useState('Checking connection...');
  const [rooms, setRooms] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // Update status when connection changes
  useEffect(() => {
    setStatus(isConnected ? 'Connected' : 'Disconnected');
    
    if (socket && isConnected) {
      // Listen for room information
      socket.on('your_rooms', (data) => {
        setRooms(data.rooms || []);
      });
      
      // Request room information
      socket.emit('get_my_rooms');
      
      return () => {
        socket.off('your_rooms');
      };
    }
  }, [socket, isConnected]);
  
  // Handle manual reconnect
  const handleReconnect = () => {
    setStatus('Reconnecting...');
    reconnect();
    toast.info('Attempting to reconnect...', { autoClose: 2000 });
  };
  
  // Handle test notification
  const handleTestNotification = () => {
    if (!socket || !isConnected) {
      toast.error('Socket not connected. Cannot send test notification.', { autoClose: 3000 });
      return;
    }
    
    testConnection();
    toast.info('Sending test notification...', { autoClose: 2000 });
  };
  
  // Toggle debug panel
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showDebug ? (
        <div className="bg-white shadow-lg rounded-lg p-4 w-80">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800">Socket Debug</h3>
            <button 
              onClick={toggleDebug}
              className="text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center mb-1">
              <div 
                className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm">Status: {status}</span>
            </div>
            <div className="text-xs text-gray-600">
              User: {currentUser?.name || 'Not logged in'} ({currentUser?.role || 'unknown'})
            </div>
            <div className="text-xs text-gray-600">
              ID: {currentUser?.id || currentUser?._id || 'unknown'}
            </div>
          </div>
          
          <div className="mb-3">
            <div className="text-sm font-medium mb-1">Rooms:</div>
            {rooms.length > 0 ? (
              <ul className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                {rooms.map((room, index) => (
                  <li key={index} className="truncate">{room}</li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-500">No rooms joined</div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleReconnect}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
            >
              Reconnect
            </button>
            <button
              onClick={handleTestNotification}
              className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded"
            >
              Test Notification
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleDebug}
          className="bg-gray-800 hover:bg-gray-900 text-white rounded-full p-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SocketDebug; 