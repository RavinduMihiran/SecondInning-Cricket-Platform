const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../models/User');
const { ActivityLog } = require('../models/ActivityLog');
const { generateAccessToken } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
exports.register = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    name, 
    email, 
    password, 
    role, 
    school, 
    district, 
    dateOfBirth,
    phone 
  } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ message: 'User already exists with this email' });
    }

    // Create a new user
    user = new User({
      name,
      email,
      password, // Will be hashed by the pre-save hook in the User model
      role: role || 'player', // Default role is player
      school,
      district,
      dateOfBirth,
      phone
    });

    // Save user to DB - the pre-save hook in the User model will hash the password
    await user.save();

    // Log user registration activity
    await ActivityLog.logActivity({
      activityType: 'user_joined',
      user: user._id,
      details: { 
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        district: user.district
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Generate token
    const token = generateAccessToken(user._id, user.role);

    // Return token and user data
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        district: user.district
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password with bcrypt
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    } catch (bcryptError) {
      console.error('bcrypt comparison error:', bcryptError);
      return res.status(500).json({ message: 'Error verifying password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account is not active. Please contact support.' });
    }

    // Log user login activity
    await ActivityLog.logActivity({
      activityType: `${user.role}_login`,
      user: user._id,
      details: { 
        name: user.name,
        email: user.email,
        role: user.role
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Generate token
    const token = generateAccessToken(user._id, user.role);

    // Return token and user data
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        district: user.district
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @route   GET api/auth/me
// @desc    Get current user profile
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    // Explicitly exclude password field
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error retrieving user profile' });
  }
};

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
exports.updateProfile = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    phone,
    school,
    district,
    dateOfBirth,
    bio
  } = req.body;

  try {
    // Build profile update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (school) updateFields.school = school;
    if (district) updateFields.district = district;
    if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
    if (bio) updateFields.bio = bio;

    // Find user by ID and update
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
exports.changePassword = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Get user from database
    const user = await User.findById(req.userId);
    
    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);

    // Save updated user
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Private
exports.logout = async (req, res) => {
  // In a stateless JWT system, the client is responsible for discarding tokens
  // We just return a success message as the client will remove stored tokens
  res.json({ message: 'Logout successful' });
}; 