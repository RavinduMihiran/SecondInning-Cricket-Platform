const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const playerController = require('../controllers/playerController');
const { upload, handleMulterError } = require('../middleware/upload');
const { ParentEngagement } = require('../models/ParentEngagement');

// @route   GET api/players
// @desc    Get all players
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Get all players route' });
});

// @route   GET api/players/search
// @desc    Search players by criteria
// @access  Public
router.get('/search', playerController.searchPlayers);

// @route   GET api/players/me
// @desc    Get current player's profile
// @access  Private
router.get('/me', auth, playerController.getCurrentPlayerProfile);

// @route   GET api/players/me/stats
// @desc    Get current player's detailed stats
// @access  Private
router.get('/me/stats', auth, playerController.getPlayerDetailedStats);

// @route   PUT api/players/me
// @desc    Update current player's profile
// @access  Private
router.put('/me', [
  auth,
  check('name', 'Name is required').optional().not().isEmpty(),
  check('school', 'School is required').optional().not().isEmpty(),
  check('district', 'District is required').optional().not().isEmpty(),
  check('dateOfBirth', 'Please provide a valid date of birth').optional().isDate(),
  check('bio', 'Bio cannot be more than 500 characters').optional().isLength({ max: 500 })
], playerController.updatePlayerProfile);

// @route   PUT api/players/me/profile-image
// @desc    Update player profile image
// @access  Private
router.put('/me/profile-image', auth, playerController.updateProfileImage);

// @route   POST api/players/me/profile-image/upload
// @desc    Upload player profile image (multipart form)
// @access  Private
router.post('/me/profile-image/upload', auth, upload.single('image'), handleMulterError, playerController.uploadProfileImage);

// @route   GET api/players/:id
// @desc    Get player by ID
// @access  Public
router.get('/:id', playerController.getPlayerProfile);

// @route   GET api/players/me/feedback
// @desc    Get feedback for the current player
// @access  Private
router.get('/me/feedback', auth, playerController.getPlayerFeedback);

// @route   PUT api/players/me/feedback/:id/read
// @desc    Mark feedback as read
// @access  Private
router.put('/me/feedback/:id/read', auth, playerController.markFeedbackAsRead);

// @route   GET api/players/me/feedback/unread
// @desc    Get count of unread feedback
// @access  Private
router.get('/me/feedback/unread', auth, playerController.getUnreadFeedbackCount);

// @route   GET api/players/me/ratings
// @desc    Get current player's ratings from coaches
// @access  Private
router.get('/me/ratings', auth, playerController.getPlayerRatings);

// @route   GET api/players/engagements/unread
// @desc    Get unread parent engagements for the logged-in player
// @access  Private (Player)
router.get('/engagements/unread', [auth, requireRole(['player'])], async (req, res) => {
  try {
    console.log('Fetching unread parent engagements for player:', req.userId);
    
    // Find unread parent engagements for this player
    const unreadEngagements = await ParentEngagement.find({
      player: req.userId,
      isRead: false
    })
    .sort({ createdAt: -1 })
    .populate('parent', 'name profileImage');
    
    console.log(`Found ${unreadEngagements.length} unread parent engagements`);
    
    res.json(unreadEngagements);
  } catch (err) {
    console.error('Error fetching unread parent engagements:', err);
    res.status(500).json({ message: 'Server error fetching unread parent engagements' });
  }
});

// @route   POST api/players/engagements/mark-read
// @desc    Mark parent engagements as read
// @access  Private (Player)
router.post('/engagements/mark-read', [auth, requireRole(['player'])], async (req, res) => {
  try {
    console.log('Marking parent engagements as read for player:', req.userId);
    
    // Get engagement IDs to mark as read
    const { engagementIds } = req.body;
    
    if (engagementIds && Array.isArray(engagementIds) && engagementIds.length > 0) {
      // Mark specific engagements as read
      const result = await ParentEngagement.updateMany(
        { 
          _id: { $in: engagementIds },
          player: req.userId
        },
        { $set: { isRead: true } }
      );
      
      console.log(`Marked ${result.modifiedCount} specific engagements as read`);
      res.json({ success: true, count: result.modifiedCount });
    } else {
      // Mark all unread engagements as read
      const result = await ParentEngagement.updateMany(
        { player: req.userId, isRead: false },
        { $set: { isRead: true } }
      );
      
      console.log(`Marked all ${result.modifiedCount} unread engagements as read`);
      res.json({ success: true, count: result.modifiedCount });
    }
  } catch (err) {
    console.error('Error marking parent engagements as read:', err);
    res.status(500).json({ message: 'Server error marking parent engagements as read' });
  }
});

module.exports = router; 