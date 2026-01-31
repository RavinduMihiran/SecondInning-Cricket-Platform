// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// Routes imports
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const coachRoutes = require('./routes/coaches');
const scoutRoutes = require('./routes/scouts');
const statsRoutes = require('./routes/stats');
const mediaRoutes = require('./routes/media');
const achievementRoutes = require('./routes/achievements');
const adminRoutes = require('./routes/admin');
const networkRoutes = require('./routes/network');
const parentRoutes = require('./routes/parents');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000, // Increase ping timeout to 60 seconds
  pingInterval: 25000 // Ping clients every 25 seconds
});

// Make io accessible to our routes
app.set('io', io);
console.log('Socket.IO initialized and attached to app');

// Store socket connections by user ID
const userSockets = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle client joining rooms based on role and user ID
  socket.on('join', ({ id, role }) => {
    console.log(`User ${id} with role ${role} joined`);
    
    // Leave all rooms first
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    // Join appropriate rooms based on role
    socket.join('announcements'); // Everyone gets announcements
    
    // Join user-specific room for direct notifications
    if (id) {
      // Use consistent room naming format: user-{id}
      const userRoom = `user-${id}`;
      socket.join(userRoom);
      console.log(`User ${id} joined personal notification room: ${userRoom}`);
      
      // Store the socket reference for this user
      if (!userSockets.has(id)) {
        userSockets.set(id, new Set());
      }
      userSockets.get(id).add(socket.id);
      
      // Debug: list all rooms after joining
      const rooms = Array.from(socket.rooms);
      console.log(`User ${id} is now in rooms:`, rooms);
      
      // Send a welcome message to confirm connection
      socket.emit('welcome', { 
        message: `Welcome ${role} ${id}! You're now connected and will receive notifications.`,
        timestamp: new Date()
      });
    }
    
    if (role === 'admin') {
      socket.join('admin');
    } else if (role === 'player') {
      socket.join('players');
    } else if (role === 'coach') {
      socket.join('coaches');
    } else if (role === 'scout') {
      socket.join('scouts');
    } else if (role === 'parent') {
      socket.join('parents');
    }
    
    socket.emit('joined', { rooms: Array.from(socket.rooms) });
  });
  
  // Debug: periodically log active rooms
  const roomInterval = setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    const playerRooms = Array.from(rooms.keys()).filter(room => room.startsWith('user-'));
    if (playerRooms.length > 0) {
      console.log('Active player rooms:', playerRooms);
    }
  }, 60000); // Log every minute
  
  // Handle client requesting their rooms
  socket.on('get_my_rooms', () => {
    const rooms = Array.from(socket.rooms);
    socket.emit('your_rooms', { rooms });
  });
  
  // Handle client requesting a test notification
  socket.on('test_notification', ({ userId }) => {
    if (userId) {
      const userRoom = `user-${userId}`;
      io.to(userRoom).emit('test_response', {
        message: 'This is a test notification',
        timestamp: new Date()
      });
      console.log(`Test notification sent to ${userRoom}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up user socket mappings
    userSockets.forEach((sockets, userId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
        console.log(`Removed socket ${socket.id} from user ${userId}`);
      }
    });
    
    clearInterval(roomInterval);
  });
});

// Add a direct notification helper to the app
app.set('sendUserNotification', (userId, event, data) => {
  if (!io) {
    console.error('Cannot send notification: Socket.IO not initialized');
    return false;
  }
  
  const userRoom = `user-${userId}`;
  console.log(`Sending ${event} notification to ${userRoom}`);
  
  // Check if room exists
  const roomExists = io.sockets.adapter.rooms.has(userRoom);
  console.log(`Room ${userRoom} exists: ${roomExists}`);
  
  // Send to all sockets in the room
  io.to(userRoom).emit(event, {
    ...data,
    timestamp: new Date()
  });
  
  // Also try direct socket delivery if we have socket mappings
  if (userSockets.has(userId)) {
    const sockets = userSockets.get(userId);
    console.log(`Also sending directly to ${sockets.size} sockets for user ${userId}`);
    
    sockets.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, {
          ...data,
          timestamp: new Date(),
          direct: true
        });
      }
    });
  }
  
  return true;
});

// Get MongoDB URI from environment or use default - ensure lowercase database name
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kavindu:xppFRIgfwykHia2E@cluster0.iofqwq5.mongodb.net/SecondInning?retryWrites=true&w=majority&appName=Cluster0';
console.log('Using MongoDB URI:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Exit with failure
  });

// Middleware
// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all auth routes
app.use('/api/auth', apiLimiter);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Apply CORS to all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// Parse JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression for response
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files
const uploadsPath = path.join(__dirname, 'uploads');
// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Configure static file serving with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'no-cache');
  next();
}, express.static(uploadsPath));

console.log(`Serving uploads from: ${uploadsPath}`);

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/scouts', scoutRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/network', networkRoutes);
console.log('Mounting admin routes at /api/admin');
app.use('/api/admin', adminRoutes);
console.log('Mounting parent routes at /api/parents');
app.use('/api/parents', parentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// API status
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to the SecondInning API',
    version: '1.0.0'
  });
});

// Not found middleware
app.use((req, res, next) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server';
  
  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} with Socket.IO enabled`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
}); 