const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const achievementController = require('../controllers/achievementController');
const { auth, requireRole } = require('../middleware/auth');

// @route   GET api/achievements/player/:playerId
// @desc    Get all achievements for a player
// @access  Public
router.get('/player/:playerId', achievementController.getPlayerAchievements);

// @route   GET api/achievements/recent
// @desc    Get recent achievements for all players (for feed)
// @access  Public
router.get('/recent', achievementController.getRecentAchievements);

// @route   GET api/achievements/stats/:playerId
// @desc    Get achievement statistics for a player
// @access  Public
router.get('/stats/:playerId', achievementController.getPlayerAchievementStats);

// @route   GET api/achievements/pending
// @desc    Get all pending achievements for admin review
// @access  Private (Admin/Coach only)
router.get(
  '/pending',
  [auth, requireRole(['admin', 'coach'])],
  achievementController.getPendingAchievements
);

// @route   GET api/achievements/:id
// @desc    Get achievement by ID
// @access  Public
router.get('/:id', achievementController.getAchievementById);

// @route   POST api/achievements
// @desc    Add a new achievement (for admins/coaches)
// @access  Private (Admin/Coach only)
router.post(
  '/',
  [
    auth,
    requireRole(['admin', 'coach']),
    check('player', 'Player ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').isIn([
      'Batting', 'Bowling', 'Fielding', 'All-Round', 'Team', 'Career', 'Special'
    ])
  ],
  achievementController.addAchievement
);

// @route   POST api/achievements/submit
// @desc    Submit an achievement for review (for players)
// @access  Private
router.post(
  '/submit',
  [
    auth,
    check('player', 'Player ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').isIn([
      'Batting', 'Bowling', 'Fielding', 'All-Round', 'Team', 'Career', 'Special'
    ])
  ],
  achievementController.submitAchievement
);

// @route   PUT api/achievements/:id/review
// @desc    Review (approve/reject) a pending achievement
// @access  Private (Admin/Coach only)
router.put(
  '/:id/review',
  [
    auth,
    requireRole(['admin', 'coach']),
    check('status', 'Status is required').isIn(['approved', 'rejected'])
  ],
  achievementController.reviewAchievement
);

// @route   PUT api/achievements/:id
// @desc    Update an achievement
// @access  Private (Admin/Coach only)
router.put(
  '/:id',
  [
    auth,
    requireRole(['admin', 'coach']),
    check('category', 'Invalid category').optional().isIn([
      'Batting', 'Bowling', 'Fielding', 'All-Round', 'Team', 'Career', 'Special'
    ]),
    check('tier', 'Invalid tier').optional().isIn([
      'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'
    ])
  ],
  achievementController.updateAchievement
);

// @route   DELETE api/achievements/:id
// @desc    Delete an achievement
// @access  Private (Admin only)
router.delete(
  '/:id',
  [auth, requireRole('admin')],
  achievementController.deleteAchievement
);

module.exports = router; 