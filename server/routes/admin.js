const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { check } = require('express-validator');

console.log('Registering admin routes...');

// Admin authentication
router.post(
  '/login',
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password is required').notEmpty()
  ],
  adminController.adminLogin
);

// Activity Logs
router.get('/activities', adminController.getRecentActivities);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Media Moderation
router.get('/media', adminController.getAllMedia);
router.put('/media/:id/approve', adminController.approveMedia);
router.put('/media/:id/reject', adminController.rejectMedia);

// Announcements
router.post(
  '/announcements',
  [
    check('title', 'Title is required').notEmpty(),
    check('content', 'Content is required').notEmpty(),
    check('type', 'Type must be valid').isIn(['general', 'trial', 'event', 'update'])
  ],
  adminController.createAnnouncement
);
router.get('/announcements', adminController.getAnnouncements);
router.put(
  '/announcements/:id',
  [
    check('title', 'Title is required').notEmpty(),
    check('content', 'Content is required').notEmpty(),
    check('type', 'Type must be valid').isIn(['general', 'trial', 'event', 'update'])
  ],
  adminController.updateAnnouncement
);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// Analytics
router.get('/dashboard-stats', adminController.getDashboardStats);

// System Management
router.get('/system-status', adminController.getSystemStatus);
router.post('/backup', adminController.createBackup);

// Player Performance Analysis
router.get('/player-stats/:id', adminController.getPlayerPerformanceStats);

// Settings Management
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// Security Management
router.get('/security/settings', adminController.getSecuritySettings);
router.put('/security/settings', adminController.updateSecuritySettings);
router.get('/security/logs', adminController.getSecurityLogs);

// Public endpoint for testing
router.get('/public-dashboard-stats', adminController.getDashboardStats);

// Test endpoint
router.get('/test', (req, res) => {
  console.log('Admin test endpoint called');
  res.json({ message: 'Admin API is working' });
});

module.exports = router; 