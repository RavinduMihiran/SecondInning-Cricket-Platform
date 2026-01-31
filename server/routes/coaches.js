const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { check } = require('express-validator');
const coachController = require('../controllers/coachController');
const { upload, handleMulterError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Middleware to pass io instance to controllers
const passIo = (req, res, next) => {
  req.io = req.app.get('io');
  next();
};

// @route   GET api/coaches/dashboard
// @desc    Get coach dashboard data
// @access  Private (Coach/Scout)
router.get('/dashboard', [auth, requireRole(['coach', 'scout'])], coachController.getDashboardData);

// @route   GET api/coaches/players/search
// @desc    Search players with advanced filters
// @access  Private (Coach/Scout)
router.get('/players/search', [auth, requireRole(['coach', 'scout'])], coachController.searchPlayers);

// @route   GET api/coaches/players/:id
// @desc    Get player details with coach's ratings
// @access  Private (Coach/Scout)
router.get('/players/:id', [auth, requireRole(['coach', 'scout'])], coachController.getPlayerDetails);

// @route   POST api/coaches/players/:id/rate
// @desc    Rate a player
// @access  Private (Coach/Scout)
router.post('/players/:id/rate', [
  auth, 
  requireRole(['coach', 'scout']),
  check('overall', 'Overall rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('batting', 'Batting rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('bowling', 'Bowling rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('fielding', 'Fielding rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('fitness', 'Fitness rating must be between 1 and 10').isInt({ min: 1, max: 10 })
], coachController.ratePlayer);

// @route   GET api/coaches/watchlist
// @desc    Get coach's watchlist
// @access  Private (Coach/Scout)
router.get('/watchlist', [auth, requireRole(['coach', 'scout'])], coachController.getWatchlist);

// @route   POST api/coaches/watchlist/add/:id
// @desc    Add player to watchlist
// @access  Private (Coach/Scout)
router.post('/watchlist/add/:id', [auth, requireRole(['coach', 'scout'])], coachController.addToWatchlist);

// @route   DELETE api/coaches/watchlist/remove/:id
// @desc    Remove player from watchlist
// @access  Private (Coach/Scout)
router.delete('/watchlist/remove/:id', [auth, requireRole(['coach', 'scout'])], coachController.removeFromWatchlist);

// @route   GET api/coaches/compare
// @desc    Compare players side by side
// @access  Private (Coach/Scout)
router.get('/compare', [auth, requireRole(['coach', 'scout'])], coachController.comparePlayers);

// @route   GET api/coaches/export/watchlist
// @desc    Export watchlist data as JSON
// @access  Private (Coach/Scout)
router.get('/export/watchlist', [auth, requireRole(['coach', 'scout'])], coachController.exportWatchlist);

// @route   POST api/coaches/players/:id/feedback
// @desc    Send feedback to a player
// @access  Private (Coach/Scout)
router.post('/players/:id/feedback', [
  auth, 
  requireRole(['coach', 'scout']),
  passIo,
  check('feedback', 'Feedback is required').notEmpty(),
  check('category', 'Category must be valid').isIn(['batting', 'bowling', 'fielding', 'fitness', 'general'])
], coachController.sendPlayerFeedback);

// @route   GET api/coaches/players/:id/feedback
// @desc    Get feedback history for a player
// @access  Private (Coach/Scout)
router.get('/players/:id/feedback', [auth, requireRole(['coach', 'scout'])], coachController.getPlayerFeedbackHistory);

// @route   GET api/coaches/me
// @desc    Get current coach's profile
// @access  Private (Coach/Scout)
router.get('/me', [auth, requireRole(['coach', 'scout'])], coachController.getCoachProfile);

// @route   PUT api/coaches/me
// @desc    Update current coach's profile
// @access  Private (Coach/Scout)
router.put('/me', [
  auth, 
  requireRole(['coach', 'scout']),
  check('name', 'Name is required').optional().not().isEmpty(),
  check('organization', 'Organization is required').optional().not().isEmpty(),
  check('dateOfBirth', 'Please provide a valid date of birth').optional().isDate(),
  check('bio', 'Bio cannot be more than 500 characters').optional().isLength({ max: 500 }),
  check('district', 'Please provide a valid district').optional().isString()
], coachController.updateCoachProfile);

// @route   PUT api/coaches/me/profile-image
// @desc    Update coach profile image
// @access  Private (Coach/Scout)
router.put('/me/profile-image', [auth, requireRole(['coach', 'scout'])], coachController.updateCoachProfileImage);

// @route   POST api/coaches/me/profile-image/upload
// @desc    Upload coach profile image (multipart form)
// @access  Private (Coach/Scout)
router.post('/me/profile-image/upload', [
  auth, 
  requireRole(['coach', 'scout']), 
  upload.single('image'), 
  handleMulterError
], coachController.uploadCoachProfileImage);

// @route   GET api/coaches/test-upload
// @desc    Test upload functionality
// @access  Public
router.get('/test-upload', (req, res) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const exists = fs.existsSync(uploadsDir);
  let isWritable = false;
  
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    isWritable = true;
  } catch (err) {
    isWritable = false;
  }
  
  res.json({
    message: 'Upload test endpoint',
    uploadsDir,
    exists,
    isWritable,
    environment: process.env.NODE_ENV
  });
});

module.exports = router; 