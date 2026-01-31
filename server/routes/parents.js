const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { check } = require('express-validator');
const parentController = require('../controllers/parentController');
const mongoose = require('mongoose');

// Middleware to pass io instance to controllers
const passIo = (req, res, next) => {
  // Get io from app and attach it to the request object
  const io = req.app.get('io');
  if (!io) {
    console.warn('Warning: Socket.IO instance not found in app');
  } else {
    console.log('Socket.IO instance found and attached to request');
  }
  req.io = io;
  next();
};

// @route   GET api/parents/dashboard
// @desc    Get parent dashboard data
// @access  Private (Parent)
router.get('/dashboard', [auth, requireRole(['parent'])], parentController.getDashboardData);

// @route   GET api/parents/children
// @desc    Get parent's children (players)
// @access  Private (Parent)
router.get('/children', [auth, requireRole(['parent'])], parentController.getChildren);

// @route   GET api/parents/children/:playerId
// @desc    Get specific child's details
// @access  Private (Parent)
router.get('/children/:playerId', [auth, requireRole(['parent'])], parentController.getChildDetails);

// @route   POST api/parents/link-player
// @desc    Link parent to player using access code
// @access  Private (Parent)
router.post('/link-player', [
  auth, 
  requireRole(['parent']),
  check('accessCode', 'Access code is required').not().isEmpty(),
  check('relationship', 'Relationship is required').optional()
], parentController.linkPlayer);

// @route   POST api/parents/generate-access-code
// @desc    Generate access code for parent (Player generates this)
// @access  Private (Player)
router.post('/generate-access-code', [auth, requireRole(['player'])], parentController.generateAccessCode);

// @route   POST api/parents/engagement
// @desc    Create parent engagement (reaction, comment, sticker)
// @access  Private (Parent)
router.post('/engagement', [
  auth, 
  requireRole(['parent']),
  passIo,
  check('playerId', 'Player ID is required').isMongoId(),
  check('contentType', 'Content type is required').isIn(['stat', 'achievement', 'feedback', 'match', 'general']),
  check('contentId').custom((value, { req }) => {
    // ContentId is required for specific content types, but optional for 'general'
    if (req.body.contentType !== 'general' && (!value || value.trim() === '')) {
      throw new Error('Content ID is required for this content type');
    }
    
    // If contentId is provided, it should be a valid MongoDB ObjectId
    if (value && value.trim() !== '' && !mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid Content ID format');
    }
    
    return true;
  }),
  check('engagementType', 'Engagement type is required').isIn(['reaction', 'comment', 'sticker']),
  check('reactionType').custom((value, { req }) => {
    if (req.body.engagementType === 'reaction' && (!value || !['love', 'proud', 'encouragement'].includes(value))) {
      throw new Error('Valid reaction type is required for reaction engagements');
    }
    return true;
  }),
  check('stickerType').custom((value, { req }) => {
    if (req.body.engagementType === 'sticker' && 
        (!value || !['well_played', 'keep_chin_up', 'great_job', 'star', 'trophy', 'thumbs_up'].includes(value))) {
      throw new Error('Valid sticker type is required for sticker engagements');
    }
    return true;
  }),
  check('comment').custom((value, { req }) => {
    if (req.body.engagementType === 'comment' && (!value || value.trim() === '')) {
      throw new Error('Comment is required for comment engagements');
    }
    if (value && value.length > 500) {
      throw new Error('Comment cannot be more than 500 characters');
    }
    return true;
  })
], parentController.createEngagement);

// @route   GET api/parents/engagements/:playerId
// @desc    Get parent engagements for a specific player
// @access  Private (Parent)
router.get('/engagements/:playerId', [auth, requireRole(['parent'])], parentController.getEngagements);

// @route   GET api/parents/feedback/:playerId
// @desc    Get coach feedback for a specific player
// @access  Private (Parent)
router.get('/feedback/:playerId', [auth, requireRole(['parent'])], parentController.getCoachFeedback);

// @route   GET api/parents/stats/:playerId
// @desc    Get match stats for a specific player
// @access  Private (Parent)
router.get('/stats/:playerId', [auth, requireRole(['parent'])], parentController.getPlayerStats);

// @route   GET api/parents/media/:playerId
// @desc    Get child's media (both public and private)
// @access  Private (Parent)
router.get('/media/:playerId', [auth, requireRole(['parent'])], parentController.getChildMedia);

module.exports = router; 