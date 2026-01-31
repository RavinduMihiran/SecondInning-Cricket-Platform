import { createContext, useEffect, useState, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnected, setLastConnected] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const { user, isAuthenticated } = useContext(AuthContext);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!isAuthenticated) return null;
    
    console.log('Initializing socket connection...');
    
    // Get the base URL without the '/api' path
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    
    console.log('Connecting to Socket.IO server at:', socketUrl);
    
    // Connect to the Socket.IO server with reconnection options
    return io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      path: '/socket.io/',
      extraHeaders: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }, [isAuthenticated]);

  // Join rooms based on user role
  const joinRooms = useCallback(() => {
    if (!socket || !user) return;
    
    console.log('Joining rooms for user:', user.role, user.id);
    
    // Make sure we're using the correct ID field
    const userId = user.id || user._id;
    
    if (!userId) {
      console.error('Cannot join rooms: User ID is missing');
      return;
    }
    
    socket.emit('join', {
      id: userId,
      role: user.role
    });
    
    // Log room joining status
    socket.on('joined', (data) => {
      console.log('Successfully joined rooms:', data.rooms);
    });
    
    // Check rooms after a short delay to verify
    setTimeout(() => {
      socket.emit('get_my_rooms');
    }, 2000);
  }, [socket, user]);

  // Set up socket listeners
  const setupSocketListeners = useCallback((socketInstance) => {
    if (!socketInstance) return;
    
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      setLastConnected(new Date());
      setConnectionError(null);
      setConnectionAttempts(0);
      
      // Show toast notification for reconnection
      if (connectionAttempts > 0) {
        toast.success('Reconnected to server!', { autoClose: 2000 });
      }
      
      // Join rooms based on user role
      if (user) {
        socketInstance.emit('join', {
          id: user.id || user._id,
          role: user.role
        });
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected. Reason:', reason);
      setIsConnected(false);
      
      // Show toast notification for disconnection
      toast.warning('Disconnected from server. Attempting to reconnect...', { 
        autoClose: 3000 
      });
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message);
      setConnectionAttempts(prev => prev + 1);
      
      // Only show toast for the first few attempts to avoid spamming
      if (connectionAttempts < 3) {
        toast.error(`Connection error: ${error.message}. Retrying...`, { 
          autoClose: 3000 
        });
      }
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
      setConnectionAttempts(attemptNumber);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
      toast.error('Failed to connect to server after multiple attempts. Please refresh the page.', {
        autoClose: false
      });
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message);
    });
    
    // Handle welcome message
    socketInstance.on('welcome', (data) => {
      console.log('Received welcome message:', data.message);
    });
    
    // Handle room information
    socketInstance.on('your_rooms', (data) => {
      console.log('Your current rooms:', data.rooms);
    });
    
    // Handle test response
    socketInstance.on('test_response', (data) => {
      console.log('Received test response:', data);
      toast.info('Test notification received!', { autoClose: 2000 });
    });
  }, [user, connectionAttempts]);

  // Main effect for socket initialization
  useEffect(() => {
    // Only connect socket if user is authenticated
    if (!isAuthenticated) {
      if (socket) {
        console.log('User not authenticated, disconnecting socket');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize new socket connection
    const socketInstance = initializeSocket();
    if (!socketInstance) return;
    
    // Set up event listeners
    setupSocketListeners(socketInstance);
    
    // Save socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, initializeSocket, setupSocketListeners]);

  // Effect to handle user changes (re-join rooms)
  useEffect(() => {
    joinRooms();
  }, [joinRooms, user]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (!socket) return;
    
    console.log('Manually reconnecting socket...');
    socket.disconnect();
    socket.connect();
    setConnectionAttempts(prev => prev + 1);
  }, [socket]);
  
  // Function to check connection and request test notification
  const testConnection = useCallback(() => {
    if (!socket || !isConnected || !user) return;
    
    const userId = user.id || user._id;
    if (!userId) return;
    
    console.log('Testing socket connection...');
    socket.emit('test_notification', { userId });
    
    // Also verify rooms
    socket.emit('get_my_rooms');
  }, [socket, isConnected, user]);

  // Periodic connection check
  useEffect(() => {
    if (!isConnected || !socket || !user) return;
    
    // Check connection every 2 minutes
    const checkInterval = setInterval(() => {
      if (socket.connected) {
        console.log('Socket is still connected');
        
        // Verify rooms periodically
        socket.emit('get_my_rooms');
      } else {
        console.log('Socket disconnected, attempting to reconnect');
        reconnect();
      }
    }, 120000); // 2 minutes
    
    return () => clearInterval(checkInterval);
  }, [isConnected, socket, user, reconnect]);

  return (
    <SocketContext.Provider 
      value={{ 
        socket, 
        isConnected, 
        connectionError,
        connectionAttempts,
        lastConnected,
        reconnect,
        testConnection
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider; 