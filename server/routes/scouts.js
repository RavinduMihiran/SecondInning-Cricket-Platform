const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { check } = require('express-validator');
const coachController = require('../controllers/coachController');

// Scouts use the same functionality as coaches
// @route   GET api/scouts/dashboard
// @desc    Get scout dashboard data
// @access  Private (Scout)
router.get('/dashboard', [auth, requireRole(['scout'])], coachController.getDashboardData);

// @route   GET api/scouts/players/search
// @desc    Search players with advanced filters
// @access  Private (Scout)
router.get('/players/search', [auth, requireRole(['scout'])], coachController.searchPlayers);

// @route   GET api/scouts/players/:id
// @desc    Get player details with scout's ratings
// @access  Private (Scout)
router.get('/players/:id', [auth, requireRole(['scout'])], coachController.getPlayerDetails);

// @route   POST api/scouts/players/:id/rate
// @desc    Rate a player
// @access  Private (Scout)
router.post('/players/:id/rate', [
  auth, 
  requireRole(['scout']),
  check('overall', 'Overall rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('batting', 'Batting rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('bowling', 'Bowling rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('fielding', 'Fielding rating must be between 1 and 10').isInt({ min: 1, max: 10 }),
  check('fitness', 'Fitness rating must be between 1 and 10').isInt({ min: 1, max: 10 })
], coachController.ratePlayer);

// @route   GET api/scouts/watchlist
// @desc    Get scout's watchlist
// @access  Private (Scout)
router.get('/watchlist', [auth, requireRole(['scout'])], coachController.getWatchlist);

// @route   POST api/scouts/watchlist/add/:id
// @desc    Add player to watchlist
// @access  Private (Scout)
router.post('/watchlist/add/:id', [auth, requireRole(['scout'])], coachController.addToWatchlist);

// @route   DELETE api/scouts/watchlist/remove/:id
// @desc    Remove player from watchlist
// @access  Private (Scout)
router.delete('/watchlist/remove/:id', [auth, requireRole(['scout'])], coachController.removeFromWatchlist);

// @route   GET api/scouts/compare
// @desc    Compare players side by side
// @access  Private (Scout)
router.get('/compare', [auth, requireRole(['scout'])], coachController.comparePlayers);

// @route   GET api/scouts/export/watchlist
// @desc    Export watchlist data as JSON
// @access  Private (Scout)
router.get('/export/watchlist', [auth, requireRole(['scout'])], coachController.exportWatchlist);

module.exports = router; 