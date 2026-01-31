import { io } from 'socket.io-client';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('Socket connecting to:', API_URL);

// Create socket connection
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Add event listeners for connection status
socket.on('connect', () => {
  console.log('Socket connected successfully:', socket.id);
  
  // Rejoin rooms if we have stored user info
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const { id, role } = JSON.parse(storedUser);
      if (id && role) {
        console.log('Auto-rejoining rooms after reconnection');
        joinRooms(id, role);
      }
    } catch (e) {
      console.error('Error parsing stored user data:', e);
    }
  }
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected. Reason:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Socket reconnected after ${attemptNumber} attempts`);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Socket reconnection attempt #${attemptNumber}`);
});

socket.on('reconnect_error', (error) => {
  console.error('Socket reconnection error:', error.message);
});

socket.on('reconnect_failed', () => {
  console.error('Socket reconnection failed after all attempts');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Join appropriate rooms based on user role and ID
export const joinRooms = (userId, role) => {
  if (!socket.connected) {
    console.warn('Socket not connected, will join rooms when connection is established');
    
    // Store user info for reconnection
    try {
      localStorage.setItem('user', JSON.stringify({ id: userId, role }));
    } catch (e) {
      console.error('Error storing user data:', e);
    }
    
    // Try to connect if not connected
    if (socket.disconnected) {
      socket.connect();
    }
    return;
  }
  
  console.log(`Joining rooms for user ${userId} with role ${role}`);
  socket.emit('join', { id: userId, role });
};

// Force reconnection if needed
export const reconnectSocket = () => {
  if (socket.disconnected) {
    console.log('Forcing socket reconnection');
    socket.connect();
  } else {
    console.log('Socket already connected, no need to reconnect');
  }
};

// Listen for successful room join
socket.on('joined', (data) => {
  console.log('Successfully joined rooms:', data.rooms);
});

export default socket; 