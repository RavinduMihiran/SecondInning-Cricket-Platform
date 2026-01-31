// Admin authentication middleware
const adminAuth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No admin token provided.' });
    }

    // In a real app, you would verify the token with JWT
    // For this demo, we're using a hardcoded token
    if (token !== 'admin-token') {
      return res.status(401).json({ message: 'Invalid admin token.' });
    }
    
    // Add admin info to request
    req.isAdmin = true;
    
    next();
  } catch (err) {
    console.error('Admin auth middleware error:', err);
    res.status(500).json({ message: 'Server error in admin authentication' });
  }
};

module.exports = adminAuth; 