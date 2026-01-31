const { User } = require('../models/User');
const Media = require('../models/Media');
const { Announcement } = require('../models/Announcement');
const { ActivityLog } = require('../models/ActivityLog');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Get recent activities for the admin dashboard
exports.getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activityType = req.query.activityType;
    const search = req.query.search;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    
    // Build query
    const query = {};
    
    // Filter by activity type
    if (activityType) {
      query.activityType = activityType;
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) {
        query.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set time to end of day for the "to" date
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.timestamp.$lte = toDate;
      }
    }
    
    // Search in user name or details
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'details.name': searchRegex },
        { 'details.userName': searchRegex },
        { 'details.title': searchRegex },
        { 'details.mediaTitle': searchRegex }
      ];
    }
    
    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email profileImage role')
      .populate('performedBy', 'name email profileImage role');
    
    res.json(activities);
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ message: 'Server error fetching activities' });
  }
};

// Admin Authentication - Hardcoded credentials
exports.adminLogin = async (req, res) => {
  console.log('Admin login attempt:', req.body);
  const { username, password } = req.body;
  
  // Check hardcoded admin credentials
  if (username === 'admin' && password === 'admin123') {
    console.log('Admin login successful');
    
    // Log admin login activity
    await ActivityLog.logActivity({
      activityType: 'admin_login',
      details: { username },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    return res.json({
      token: 'admin-token', // In a real app, generate a proper JWT token
      user: {
        id: 'admin',
        name: 'Administrator',
        role: 'admin'
      }
    });
  }
  
  console.log('Admin login failed - invalid credentials');
  return res.status(401).json({ message: 'Invalid admin credentials' });
};

// User Management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log user status change activity
    await ActivityLog.logActivity({
      activityType: isActive ? 'user_updated' : 'user_deactivated',
      user: user._id,
      details: { 
        action: isActive ? 'activated' : 'deactivated',
        userName: user.name,
        userRole: user.role
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    res.json(user);
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ message: 'Server error updating user status' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// Media Moderation
exports.getAllMedia = async (req, res) => {
  try {
    const media = await Media.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    // Add file URLs to each media item for proper display
    const mediaWithUrls = media.map(item => {
      const itemObj = item.toObject();
      itemObj.fileUrl = `/uploads/${item.filePath}`;
      return itemObj;
    });
    
    res.json(mediaWithUrls);
  } catch (err) {
    console.error('Error fetching media:', err);
    res.status(500).json({ message: 'Server error fetching media' });
  }
};

exports.approveMedia = async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        notificationSent: false,
        moderationDate: new Date(),
        moderationReason: req.body.reason || 'Content meets community guidelines'
      },
      { new: true }
    ).populate('user', 'name email');
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    // Log media approval activity
    await ActivityLog.logActivity({
      activityType: 'media_approved',
      user: media.user._id,
      details: { 
        mediaId: media._id,
        mediaTitle: media.title,
        mediaType: media.type,
        reason: req.body.reason || 'Content meets community guidelines'
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    // Emit socket event for notification
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting media-approved event to user ${media.user._id}`);
      io.to(`user-${media.user._id}`).emit('media-approved', {
        mediaId: media._id,
        title: media.title,
        message: 'Your media has been approved'
      });
    } else {
      console.warn('Socket.IO not available for emitting media-approved event');
    }
    
    res.json(media);
  } catch (err) {
    console.error('Error approving media:', err);
    res.status(500).json({ message: 'Server error approving media' });
  }
};

exports.rejectMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate('user', 'name email');
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    // Update media status
    media.isApproved = false;
    media.notificationSent = false;
    media.moderationDate = new Date();
    media.moderationReason = req.body.reason || 'Content does not meet community guidelines';
    
    await media.save();
    
    // Delete the file from storage
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      const filePath = path.join(uploadsDir, media.filePath);
      
      console.log(`Attempting to delete rejected file: ${filePath}`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Successfully deleted rejected file: ${filePath}`);
      } else {
        console.log(`Rejected file not found at path: ${filePath}`);
      }
      
      // Delete thumbnail if it exists and is different from main file
      if (media.thumbnail && media.thumbnail !== media.filePath) {
        const thumbnailPath = path.join(uploadsDir, media.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
          console.log(`Successfully deleted rejected thumbnail: ${thumbnailPath}`);
        }
      }
    } catch (err) {
      console.error('Error deleting rejected file from storage:', err);
      // Continue with notification even if file deletion fails
    }
    
    // Emit socket event for notification
    const io = req.app.get('io');
    if (io) {
      const userId = media.user._id.toString();
      const userRoom = `user-${userId}`;
      
      console.log('========== NOTIFICATION DEBUG ==========');
      console.log(`Attempting to send notification to user ${userId}`);
      console.log(`Room name: ${userRoom}`);
      console.log(`Active socket rooms:`, io.sockets.adapter.rooms);
      console.log(`Is room ${userRoom} available:`, io.sockets.adapter.rooms.has(userRoom));
      console.log(`Number of clients in room:`, io.sockets.adapter.rooms.get(userRoom)?.size || 0);
      
      // Notification payload
      const notificationData = {
        mediaId: media._id,
        title: media.title,
        reason: media.moderationReason,
        message: 'Your media has been rejected'
      };
      
      console.log(`Emitting media-rejected event with data:`, notificationData);
      
      // Emit to specific user room
      io.to(userRoom).emit('media-rejected', notificationData);
      
      // Also emit to all players as a fallback (for testing)
      io.to('players').emit('media-rejected', {
        ...notificationData,
        fromFallback: true
      });
      
      console.log('Notification sent. Check client for reception.');
      console.log('========== END DEBUG ==========');
    } else {
      console.warn('Socket.IO not available for emitting media-rejected event');
    }
    
    res.json(media);
  } catch (err) {
    console.error('Error rejecting media:', err);
    res.status(500).json({ message: 'Server error rejecting media' });
  }
};

// Announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      type = 'general', 
      isActive = true,
      startDate,
      endDate,
      location,
      image,
      priority = 0
    } = req.body;
    
    console.log('Creating new announcement:', req.body);
    
    const announcement = new Announcement({
      title,
      content,
      type,
      isActive,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      location,
      image,
      priority,
      createdAt: new Date() // Explicitly set creation timestamp
    });
    
    const savedAnnouncement = await announcement.save();
    console.log('Announcement created successfully:', savedAnnouncement);
    
    // Emit socket event for new announcement
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting new-announcement socket event');
      io.to('announcements').emit('new-announcement', savedAnnouncement);
    } else {
      console.warn('Socket.IO not available for emitting new-announcement event');
    }
    
    res.status(201).json(savedAnnouncement);
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ message: 'Server error creating announcement' });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    console.log('Fetching all announcements for admin');
    
    const announcements = await Announcement.find()
      .sort({ priority: -1, createdAt: -1 }); // Sort by priority (high to low), then by creation date (newest first)
    
    console.log(`Found ${announcements.length} announcements`);
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      type,
      isActive,
      startDate,
      endDate,
      location,
      image,
      priority
    } = req.body;
    
    console.log('Updating announcement:', req.params.id, req.body);
    
    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (image !== undefined) updateData.image = image;
    if (priority !== undefined) updateData.priority = priority;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    console.log('Announcement updated successfully:', announcement);
    
    // Emit socket event for updated announcement
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting update-announcement socket event');
      io.to('announcements').emit('update-announcement', announcement);
    } else {
      console.warn('Socket.IO not available for emitting update-announcement event');
    }
    
    res.json(announcement);
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ message: 'Server error updating announcement' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Emit socket event for deleted announcement
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting delete-announcement socket event');
      io.to('announcements').emit('delete-announcement', { id: req.params.id });
    } else {
      console.warn('Socket.IO not available for emitting delete-announcement event');
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ message: 'Server error deleting announcement' });
  }
};

// Analytics
exports.getDashboardStats = async (req, res) => {
  console.log('getDashboardStats endpoint called');
  try {
    console.log('Fetching user counts by role...');
    // Get user counts by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('User counts by role:', JSON.stringify(usersByRole));
    
    console.log('Fetching active users count...');
    // Get active users count
    const activeUsers = await User.countDocuments({ isActive: true });
    console.log('Active users count:', activeUsers);
    
    console.log('Fetching recent media uploads...');
    // Get recent media uploads
    const recentMedia = await Media.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    console.log('Recent media uploads:', recentMedia);
    
    console.log('Fetching total users count...');
    // Get total users
    const totalUsers = await User.countDocuments();
    console.log('Total users count:', totalUsers);
    
    // Get user growth over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Get media statistics
    const mediaStats = await Media.aggregate([
      {
        $group: {
          _id: "$fileType",
          count: { $sum: 1 },
          totalSize: { $sum: "$fileSize" }
        }
      }
    ]);
    
    // Get pending approvals count
    const pendingMediaCount = await Media.countDocuments({ isApproved: { $ne: true } });
    
    // Get system health statistics
    const systemHealth = {
      status: 'healthy',
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Mock data
      diskUsage: {
        total: 1000000000, // 1GB mock data
        used: 350000000,   // 350MB mock data
        free: 650000000    // 650MB mock data
      }
    };
    
    const responseData = {
      usersByRole,
      activeUsers,
      totalUsers,
      recentMedia,
      userGrowth,
      mediaStats,
      pendingMediaCount,
      systemHealth
    };
    
    console.log('Sending dashboard stats response:', JSON.stringify(responseData));
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// System Management
exports.getSystemStatus = async (req, res) => {
  try {
    // This would typically connect to actual system monitoring
    // For now, we'll return mock data
    const systemStatus = {
      status: 'operational',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date(),
      services: {
        database: {
          status: 'connected',
          responseTime: 45 // ms
        },
        fileStorage: {
          status: 'operational',
          totalSpace: 5000000000, // 5GB
          usedSpace: 1200000000,  // 1.2GB
          freeSpace: 3800000000   // 3.8GB
        }
      }
    };
    
    res.json(systemStatus);
  } catch (err) {
    console.error('Error getting system status:', err);
    res.status(500).json({ message: 'Server error getting system status' });
  }
};

// Backup Management
exports.createBackup = async (req, res) => {
  try {
    // In a real implementation, this would trigger a database backup process
    // For now, we'll simulate a successful backup
    
    const backupDetails = {
      id: `backup-${Date.now()}`,
      timestamp: new Date(),
      size: Math.floor(Math.random() * 50000000) + 10000000, // Random size between 10MB and 60MB
      status: 'completed',
      files: ['users.bson', 'media.bson', 'stats.bson', 'announcements.bson']
    };
    
    res.json({ 
      message: 'Backup created successfully', 
      backup: backupDetails 
    });
  } catch (err) {
    console.error('Error creating backup:', err);
    res.status(500).json({ message: 'Server error creating backup' });
  }
};

// Player Performance Analysis
exports.getPlayerPerformanceStats = async (req, res) => {
  try {
    const playerId = req.params.id;
    
    // This would typically fetch real performance data
    // For now, we'll return mock data for demonstration
    const performanceData = {
      battingAverage: 42.5,
      bowlingAverage: 25.3,
      matchesPlayed: 15,
      highestScore: 87,
      bestBowling: "4/25",
      recentForm: [45, 12, 67, 23, 56],
      strengths: ["Pull shot", "Yorkers"],
      weaknesses: ["Short balls", "Spin bowling"],
      improvementAreas: ["Footwork against spin", "Death bowling"]
    };
    
    res.json(performanceData);
  } catch (err) {
    console.error('Error getting player performance stats:', err);
    res.status(500).json({ message: 'Server error getting player performance stats' });
  }
};

// Settings Management
exports.getSystemSettings = async (req, res) => {
  try {
    // In a real implementation, these would be fetched from a database
    // For now, we'll return default settings
    const settings = {
      siteName: 'SecondInning Cricket',
      siteDescription: 'Cricket player development and scouting platform',
      maintenanceMode: false,
      allowRegistration: true,
      emailNotifications: true,
      defaultUserRole: 'player',
      maxUploadSize: 10, // in MB
      mediaApprovalRequired: true,
      analyticsEnabled: true,
      theme: 'default'
    };
    
    res.json(settings);
  } catch (err) {
    console.error('Error fetching system settings:', err);
    res.status(500).json({ message: 'Server error fetching system settings' });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // Validate required fields
    if (!settings.siteName) {
      return res.status(400).json({ message: 'Site name is required' });
    }
    
    // In a real implementation, these would be saved to a database
    // For now, we'll just return the settings that were sent
    
    // Log settings update activity
    await ActivityLog.logActivity({
      activityType: 'settings_updated',
      performedBy: req.userId,
      details: { 
        action: 'updated_system_settings'
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (err) {
    console.error('Error updating system settings:', err);
    res.status(500).json({ message: 'Server error updating system settings' });
  }
};

// Security Management
exports.getSecuritySettings = async (req, res) => {
  try {
    // In a real implementation, these would be fetched from a database
    // For now, we'll return default security settings
    const securitySettings = {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiryDays: 90,
      },
      loginSecurity: {
        maxLoginAttempts: 5,
        lockoutDuration: 30, // minutes
        twoFactorAuth: false,
        requireEmailVerification: true,
      },
      sessionSecurity: {
        sessionTimeout: 60, // minutes
        rememberMeDuration: 30, // days
        enforceSSL: true,
      }
    };
    
    res.json(securitySettings);
  } catch (err) {
    console.error('Error fetching security settings:', err);
    res.status(500).json({ message: 'Server error fetching security settings' });
  }
};

exports.updateSecuritySettings = async (req, res) => {
  try {
    const securitySettings = req.body;
    
    // Validate required fields
    if (!securitySettings.passwordPolicy || !securitySettings.loginSecurity || !securitySettings.sessionSecurity) {
      return res.status(400).json({ message: 'Invalid security settings structure' });
    }
    
    // In a real implementation, these would be saved to a database
    // For now, we'll just return the settings that were sent
    
    // Log security settings update activity
    await ActivityLog.logActivity({
      activityType: 'security_settings_updated',
      performedBy: req.userId,
      details: { 
        action: 'updated_security_settings'
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    res.json({
      message: 'Security settings updated successfully',
      securitySettings
    });
  } catch (err) {
    console.error('Error updating security settings:', err);
    res.status(500).json({ message: 'Server error updating security settings' });
  }
};

exports.getSecurityLogs = async (req, res) => {
  try {
    // In a real implementation, these would be fetched from a database
    // For now, we'll return mock security logs
    const mockLogs = [
      { id: 1, type: 'login_success', user: 'admin', ip: '192.168.1.1', userAgent: 'Chrome/98.0.4758.102', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: 2, type: 'login_failed', user: 'unknown', ip: '203.0.113.1', userAgent: 'Firefox/97.0', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { id: 3, type: 'password_changed', user: 'admin', ip: '192.168.1.1', userAgent: 'Chrome/98.0.4758.102', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { id: 4, type: 'login_failed', user: 'coach1', ip: '198.51.100.1', userAgent: 'Safari/15.3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
      { id: 5, type: 'account_locked', user: 'coach1', ip: '198.51.100.1', userAgent: 'Safari/15.3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3 - 1000).toISOString() },
      { id: 6, type: 'login_success', user: 'scout1', ip: '203.0.113.5', userAgent: 'Edge/98.0.1108.56', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
      { id: 7, type: 'login_success', user: 'player1', ip: '192.0.2.1', userAgent: 'Mobile Chrome/98.0.4758.101', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
    ];
    
    res.json(mockLogs);
  } catch (err) {
    console.error('Error fetching security logs:', err);
    res.status(500).json({ message: 'Server error fetching security logs' });
  }
};

module.exports = exports; 