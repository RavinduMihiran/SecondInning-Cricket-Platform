const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

// @route   GET api/stats/player/:playerId
// @desc    Get stats for a player
// @access  Public
router.get('/player/:playerId', statsController.getPlayerStats);

// @route   GET api/stats/summary
// @desc    Get stats summary for the current user
// @access  Private
router.get('/summary', auth, statsController.getStatsSummary);

// @route   GET api/stats/recent
// @desc    Get recent matches for the current user
// @access  Private
router.get('/recent', auth, statsController.getRecentMatches);

// @route   GET api/stats/performance
// @desc    Get performance trend data for the current user
// @access  Private
router.get('/performance', auth, statsController.getPerformanceTrend);

// @route   GET api/stats/announcements
// @desc    Get announcements for players
// @access  Private
router.get('/announcements', auth, statsController.getAnnouncements);

// @route   GET api/stats/detailed
// @desc    Get detailed cricket stats for the current user
// @access  Private
router.get('/detailed', auth, statsController.getDetailedStats);

// @route   POST api/stats
// @desc    Add new stats entry
// @access  Private
router.post('/', [
  auth,
  check('opponent', 'Opponent name is required').not().isEmpty(),
  check('date', 'Valid match date is required').isDate(),
  check('batting.runs', 'Runs must be a number').isNumeric(),
  check('batting.balls', 'Balls must be a number').optional().isNumeric(),
  check('bowling.overs', 'Overs must be a number').optional().isNumeric(),
  check('bowling.wickets', 'Wickets must be a number').optional().isNumeric()
], statsController.addStats);

module.exports = router; 