const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// Explicitly get environment variables or use defaults
const JWT_SECRET = process.env.JWT_SECRET || 'cricket_talent_platform_secret_key_2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// Generate access token with longer expiration
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE } // Longer expiration for simplicity
  );
};

// Middleware to authenticate the access token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Find user with token
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid token. User not found.' });
      }
      
      // Add user and role info to request
      req.user = user;
      req.userId = user._id;
      
      // Use the role from the token if available, otherwise from the user object
      req.userRole = decoded.role || user.role;
      
      console.log('Auth middleware:', {
        userId: req.userId.toString(),
        userRole: req.userRole
      });
      
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // If roles is a string, convert to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    
    next();
  };
};

module.exports = {
  auth,
  requireRole,
  generateAccessToken
}; 