import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import ConnectionStatus from './ConnectionStatus';

const SocketDebugPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [events, setEvents] = useState([]);
  const { socket, isConnected, reconnect } = useContext(SocketContext);
  
  // Listen for all socket events
  useEffect(() => {
    if (!socket) return;
    
    const logEvent = (eventName, data) => {
      const timestamp = new Date();
      setEvents(prev => [
        { 
          id: Date.now() + Math.random(), 
          eventName, 
          data: JSON.stringify(data), 
          timestamp 
        },
        ...prev.slice(0, 49) // Keep only the last 50 events
      ]);
    };
    
    // Listen for connection events
    socket.on('connect', () => {
      logEvent('connect', { socketId: socket.id });
    });
    
    socket.on('disconnect', (reason) => {
      logEvent('disconnect', { reason });
    });
    
    socket.on('connect_error', (error) => {
      logEvent('connect_error', { message: error.message });
    });
    
    // Listen for application-specific events
    const appEvents = [
      'new-announcement', 
      'update-announcement', 
      'delete-announcement'
    ];
    
    appEvents.forEach(eventName => {
      socket.on(eventName, (data) => {
        logEvent(eventName, data);
      });
    });
    
    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      
      appEvents.forEach(eventName => {
        socket.off(eventName);
      });
    };
  }, [socket]);
  
  // Format timestamp
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };
  
  // Get event color
  const getEventColor = (eventName) => {
    switch (eventName) {
      case 'connect':
        return 'text-green-600';
      case 'disconnect':
      case 'connect_error':
        return 'text-red-600';
      case 'new-announcement':
        return 'text-blue-600';
      case 'update-announcement':
        return 'text-purple-600';
      case 'delete-announcement':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };
  
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsExpanded(true)}
          className="bg-gray-800 text-white px-3 py-1.5 rounded-md text-xs font-mono flex items-center"
        >
          <span className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          Socket Debug
        </button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-3 bg-gray-800 flex justify-between items-center">
        <div className="text-sm font-mono font-bold">Socket Debug Panel</div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setEvents([])}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            title="Clear events"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
          >
            Minimize
          </button>
        </div>
      </div>
      
      <div className="p-3 border-b border-gray-700">
        <ConnectionStatus className="bg-gray-800 p-2 rounded" />
      </div>
      
      <div className="h-64 overflow-y-auto p-1 bg-gray-950">
        {events.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-xs">
            No events recorded yet
          </div>
        ) : (
          <div className="space-y-1 font-mono text-xs">
            {events.map(event => (
              <div key={event.id} className="p-1.5 border-l-2 bg-gray-900 hover:bg-gray-800" style={{ borderLeftColor: getEventColor(event.eventName).replace('text-', 'border-') }}>
                <div className="flex justify-between">
                  <span className={`font-bold ${getEventColor(event.eventName)}`}>{event.eventName}</span>
                  <span className="text-gray-400">{formatTime(event.timestamp)}</span>
                </div>
                <div className="text-gray-300 break-all mt-1">{event.data}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-2 bg-gray-800 flex justify-between items-center">
        <div className="text-xs text-gray-400">
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <button 
          onClick={reconnect}
          className="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded"
          disabled={!socket}
        >
          Reconnect
        </button>
      </div>
    </div>
  );
};

export default SocketDebugPanel; 