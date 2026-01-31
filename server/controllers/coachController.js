const { User } = require('../models/User');
const { PlayerStat } = require('../models/PlayerStat');
const { PlayerRating } = require('../models/PlayerRating');
const { Watchlist } = require('../models/Watchlist');
const { CoachFeedback } = require('../models/CoachFeedback');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @route   GET api/coaches/players/search
// @desc    Search players with advanced filters
// @access  Private (Coach/Scout)
exports.searchPlayers = async (req, res) => {
  try {
    console.log('Search players request received:', req.query);
    
    const {
      query,
      minAge,
      maxAge,
      region,
      school,
      role,
      minRuns,
      maxRuns,
      minWickets,
      maxWickets,
      minBattingAvg,
      maxBattingAvg,
      minBowlingAvg,
      maxBowlingAvg,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20
    } = req.query;

    // Build search filter
    const filter = { role: 'player' };
    
    // Text search - Use simple regex for name search
    if (query) {
      try {
        filter.name = { $regex: query, $options: 'i' };
      } catch (regexError) {
        console.error('Invalid regex pattern:', regexError);
        // Fallback to simple string match if regex fails
        filter.name = query;
      }
    }
    
    // Region/District filter
    if (region) {
      try {
      filter.district = { $regex: region, $options: 'i' };
      } catch (regexError) {
        console.error('Invalid regex pattern for district:', regexError);
        filter.district = region;
      }
    }
    
    // School filter
    if (school) {
      try {
      filter.school = { $regex: school, $options: 'i' };
      } catch (regexError) {
        console.error('Invalid regex pattern for school:', regexError);
        filter.school = school;
      }
    }
    
    // Age filter - requires dateOfBirth field
    if (minAge || maxAge) {
      filter.dateOfBirth = {};
      
      if (minAge) {
        try {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - parseInt(minAge));
        filter.dateOfBirth.$lte = maxDate;
        } catch (dateError) {
          console.error('Error calculating min age date:', dateError);
          delete filter.dateOfBirth.$lte;
        }
      }
      
      if (maxAge) {
        try {
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - parseInt(maxAge));
        filter.dateOfBirth.$gte = minDate;
        } catch (dateError) {
          console.error('Error calculating max age date:', dateError);
          delete filter.dateOfBirth.$gte;
        }
      }
      
      // If both date filters failed, remove the empty dateOfBirth filter
      if (Object.keys(filter.dateOfBirth).length === 0) {
        delete filter.dateOfBirth;
      }
    }
    
    // Stats filters - with error handling
    if (minRuns || maxRuns || minWickets || maxWickets || 
        minBattingAvg || maxBattingAvg || minBowlingAvg || maxBowlingAvg) {
      
      if (minRuns) {
        try {
          const minRunsVal = parseInt(minRuns);
          if (!isNaN(minRunsVal)) {
            filter['stats.runs'] = { $gte: minRunsVal };
      }
        } catch (parseError) {
          console.error('Error parsing minRuns:', parseError);
        }
      }
      
      if (maxRuns) {
        try {
          const maxRunsVal = parseInt(maxRuns);
          if (!isNaN(maxRunsVal)) {
            filter['stats.runs'] = { ...filter['stats.runs'] || {}, $lte: maxRunsVal };
          }
        } catch (parseError) {
          console.error('Error parsing maxRuns:', parseError);
      }
      }
      
      // Apply the same pattern for other numeric filters
      if (minWickets) {
        try {
          const minWicketsVal = parseInt(minWickets);
          if (!isNaN(minWicketsVal)) {
            filter['stats.wickets'] = { $gte: minWicketsVal };
      }
        } catch (parseError) {
          console.error('Error parsing minWickets:', parseError);
        }
      }
      
      if (maxWickets) {
        try {
          const maxWicketsVal = parseInt(maxWickets);
          if (!isNaN(maxWicketsVal)) {
            filter['stats.wickets'] = { ...filter['stats.wickets'] || {}, $lte: maxWicketsVal };
          }
        } catch (parseError) {
          console.error('Error parsing maxWickets:', parseError);
        }
      }
      
      if (minBattingAvg) {
        try {
          const minBattingAvgVal = parseFloat(minBattingAvg);
          if (!isNaN(minBattingAvgVal)) {
            filter['stats.battingAvg'] = { $gte: minBattingAvgVal };
      }
        } catch (parseError) {
          console.error('Error parsing minBattingAvg:', parseError);
        }
      }
      
      if (maxBattingAvg) {
        try {
          const maxBattingAvgVal = parseFloat(maxBattingAvg);
          if (!isNaN(maxBattingAvgVal)) {
            filter['stats.battingAvg'] = { ...filter['stats.battingAvg'] || {}, $lte: maxBattingAvgVal };
          }
        } catch (parseError) {
          console.error('Error parsing maxBattingAvg:', parseError);
        }
      }
      
      if (minBowlingAvg) {
        try {
          const minBowlingAvgVal = parseFloat(minBowlingAvg);
          if (!isNaN(minBowlingAvgVal)) {
            filter['stats.bowlingAvg'] = { $gte: minBowlingAvgVal };
      }
        } catch (parseError) {
          console.error('Error parsing minBowlingAvg:', parseError);
        }
      }
      
      if (maxBowlingAvg) {
        try {
          const maxBowlingAvgVal = parseFloat(maxBowlingAvg);
          if (!isNaN(maxBowlingAvgVal)) {
            filter['stats.bowlingAvg'] = { ...filter['stats.bowlingAvg'] || {}, $lte: maxBowlingAvgVal };
          }
        } catch (parseError) {
          console.error('Error parsing maxBowlingAvg:', parseError);
      }
    }
    }
    
    console.log('Search filter:', JSON.stringify(filter, null, 2));
    
    // Determine sort order
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      
      switch (sortBy) {
        case 'name':
          sort.name = order;
          break;
        case 'age':
          sort.dateOfBirth = -order; // Reverse for age (younger birth date = older age)
          break;
        case 'runs':
          sort['stats.runs'] = order;
          break;
        case 'wickets':
          sort['stats.wickets'] = order;
          break;
        case 'battingAvg':
          sort['stats.battingAvg'] = order;
          break;
        case 'bowlingAvg':
          sort['stats.bowlingAvg'] = order;
          break;
        default:
          sort = { 'stats.runs': -1, 'stats.wickets': -1 }; // Default sort
      }
    } else {
      sort = { 'stats.runs': -1, 'stats.wickets': -1 }; // Default sort
    }
    
    // Pagination with validation
    let pageNum = 1;
    let limitNum = 20;
    
    try {
      pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    } catch (parseError) {
      console.error('Error parsing page parameter:', parseError);
    }
    
    try {
      limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1) limitNum = 20;
      if (limitNum > 50) limitNum = 50; // Cap at 50 for performance
    } catch (parseError) {
      console.error('Error parsing limit parameter:', parseError);
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    // Find players matching criteria with error handling
    let players = [];
    let total = 0;
    
    try {
      players = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort(sort)
      .skip(skip)
        .limit(limitNum);
      
      console.log(`Found ${players.length} players matching criteria`);
    
    // Count total matching documents for pagination
      total = await User.countDocuments(filter);
      console.log(`Total matching players: ${total}`);
    } catch (dbError) {
      console.error('Database error when finding players:', dbError);
      return res.status(500).json({ 
        message: 'Database error when searching players',
        error: dbError.message 
      });
    }
    
    // Handle case where no players found
    if (players.length === 0) {
      return res.json({
        players: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          pages: 0
        }
      });
    }
    
    // Get player IDs for further queries
    const playerIds = players.map(player => player._id);
    
    // Get coach's ratings for these players
    let ratings = [];
    try {
      ratings = await PlayerRating.find({
      coach: req.userId,
      player: { $in: playerIds }
    });
      console.log(`Found ${ratings.length} ratings for these players`);
    } catch (ratingsError) {
      console.error('Error fetching player ratings:', ratingsError);
      // Continue without ratings if this fails
    }
    
    // Map ratings to players
    const ratingsMap = {};
    ratings.forEach(rating => {
      ratingsMap[rating.player.toString()] = rating;
    });
    
    // Check if players are in watchlist
    let watchlistItems = [];
    try {
      watchlistItems = await Watchlist.find({
      coach: req.userId,
      player: { $in: playerIds }
    });
      console.log(`Found ${watchlistItems.length} watchlist items for these players`);
    } catch (watchlistError) {
      console.error('Error fetching watchlist items:', watchlistError);
      // Continue without watchlist data if this fails
    }
    
    const watchlistMap = {};
    watchlistItems.forEach(item => {
      watchlistMap[item.player.toString()] = true;
    });
    
    // Map to public JSON with ratings and watchlist status
    const playersWithRatings = players.map(player => {
      try {
      const playerObj = player.toPublicJSON();
      const playerId = player._id.toString();
      
      // Add rating if exists
      if (ratingsMap[playerId]) {
        playerObj.rating = {
          overall: ratingsMap[playerId].overall,
          batting: ratingsMap[playerId].batting,
          bowling: ratingsMap[playerId].bowling,
          fielding: ratingsMap[playerId].fielding,
          fitness: ratingsMap[playerId].fitness,
          tags: ratingsMap[playerId].tags,
          notes: ratingsMap[playerId].notes
        };
      }
      
      // Add watchlist status
      playerObj.inWatchlist = !!watchlistMap[playerId];
      
      return playerObj;
      } catch (playerError) {
        console.error('Error processing player data:', playerError, 'player:', player._id);
        // Return a simplified player object if there's an error
        return {
          _id: player._id,
          name: player.name || 'Unknown Player',
          error: 'Error processing complete player data'
        };
      }
    });
    
    // Send response
    res.json({
      players: playersWithRatings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error searching players:', err);
    res.status(500).json({ 
      message: 'Server error searching players', 
      error: err.message 
    });
  }
};

// @route   GET api/coaches/players/:id
// @desc    Get player details with coach's ratings
// @access  Private (Coach/Scout)
exports.getPlayerDetails = async (req, res) => {
  try {
    const playerId = req.params.id;
    
    // Get player profile
    const player = await User.findById(playerId);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Get player's stats
    const stats = await PlayerStat.find({ player: playerId })
      .sort({ 'match.date': -1 })
      .limit(10);
    
    // Get coach's rating for this player
    const rating = await PlayerRating.findOne({
      coach: req.userId,
      player: playerId
    });
    
    // Check if player is in watchlist
    const watchlistItem = await Watchlist.findOne({
      coach: req.userId,
      player: playerId
    });
    
    // Prepare response
    const playerProfile = player.toPublicJSON();
    
    // Add rating if exists
    if (rating) {
      playerProfile.rating = {
        overall: rating.overall,
        batting: rating.batting,
        bowling: rating.bowling,
        fielding: rating.fielding,
        fitness: rating.fitness,
        tags: rating.tags,
        notes: rating.notes,
        lastUpdated: rating.updatedAt
      };
    }
    
    // Add watchlist status
    playerProfile.inWatchlist = !!watchlistItem;
    
    // Add recent stats
    playerProfile.recentStats = stats;
    
    res.json(playerProfile);
  } catch (err) {
    console.error('Error fetching player details:', err);
    res.status(500).json({ message: 'Server error fetching player details' });
  }
};

// @route   POST api/coaches/players/:id/rate
// @desc    Rate a player
// @access  Private (Coach/Scout)
exports.ratePlayer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const playerId = req.params.id;
    const coachId = req.userId;
    
    const {
      overall,
      batting,
      bowling,
      fielding,
      fitness,
      tags,
      notes
    } = req.body;
    
    // Check if player exists
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Find existing rating or create new one
    let rating = await PlayerRating.findOne({
      coach: coachId,
      player: playerId
    });
    
    if (rating) {
      // Update existing rating
      rating.overall = overall;
      rating.batting = batting;
      rating.bowling = bowling;
      rating.fielding = fielding;
      rating.fitness = fitness;
      rating.tags = tags;
      rating.notes = notes;
      
      await rating.save();
    } else {
      // Create new rating
      rating = new PlayerRating({
        coach: coachId,
        player: playerId,
        overall,
        batting,
        bowling,
        fielding,
        fitness,
        tags,
        notes
      });
      
      await rating.save();
    }
    
    res.json(rating);
  } catch (err) {
    console.error('Error rating player:', err);
    res.status(500).json({ message: 'Server error rating player' });
  }
};

// @route   POST api/coaches/watchlist/add/:id
// @desc    Add player to watchlist
// @access  Private (Coach/Scout)
exports.addToWatchlist = async (req, res) => {
  try {
    const playerId = req.params.id;
    const coachId = req.userId;
    
    // Check if player exists
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Check if already in watchlist
    let watchlistItem = await Watchlist.findOne({
      coach: coachId,
      player: playerId
    });
    
    if (watchlistItem) {
      return res.status(400).json({ message: 'Player already in watchlist' });
    }
    
    // Add to watchlist
    watchlistItem = new Watchlist({
      coach: coachId,
      player: playerId,
      notes: req.body.notes || ''
    });
    
    await watchlistItem.save();
    
    res.json(watchlistItem);
  } catch (err) {
    console.error('Error adding player to watchlist:', err);
    res.status(500).json({ message: 'Server error adding player to watchlist' });
  }
};

// @route   DELETE api/coaches/watchlist/remove/:id
// @desc    Remove player from watchlist
// @access  Private (Coach/Scout)
exports.removeFromWatchlist = async (req, res) => {
  try {
    const playerId = req.params.id;
    const coachId = req.userId;
    
    // Remove from watchlist
    const result = await Watchlist.findOneAndDelete({
      coach: coachId,
      player: playerId
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Player not found in watchlist' });
    }
    
    res.json({ message: 'Player removed from watchlist' });
  } catch (err) {
    console.error('Error removing player from watchlist:', err);
    res.status(500).json({ message: 'Server error removing player from watchlist' });
  }
};

// @route   GET api/coaches/watchlist
// @desc    Get coach's watchlist
// @access  Private (Coach/Scout)
exports.getWatchlist = async (req, res) => {
  try {
    const coachId = req.userId;
    
    // Get watchlist items with player details
    const watchlist = await Watchlist.find({ coach: coachId })
      .populate({
        path: 'player',
        select: '-password -passwordResetToken -passwordResetExpires'
      })
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedWatchlist = watchlist.map(item => {
      return {
        id: item._id,
        player: item.player.toPublicJSON(),
        notes: item.notes,
        addedAt: item.createdAt
      };
    });
    
    res.json(formattedWatchlist);
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    res.status(500).json({ message: 'Server error fetching watchlist' });
  }
};

// @route   GET api/coaches/compare
// @desc    Compare players side by side
// @access  Private (Coach/Scout)
exports.comparePlayers = async (req, res) => {
  try {
    const { players } = req.query;
    
    console.log('Compare players request received, query params:', req.query);
    
    // Handle different formats of the players parameter
    let playerIds = [];
    
    if (Array.isArray(players)) {
      // If it's already an array, use it directly
      playerIds = players.filter(Boolean);
    } else if (typeof players === 'string') {
      // If it's a comma-separated string, split it
      if (players.includes(',')) {
        playerIds = players.split(',').filter(Boolean);
      } else {
        // If it's a single ID
        playerIds = [players];
      }
    } else {
      return res.status(400).json({ message: 'Please provide valid player IDs to compare' });
    }
    
    if (playerIds.length === 0) {
      return res.status(400).json({ message: 'No valid player IDs provided' });
    }
    
    // Validate MongoDB ObjectIds
    const validIds = playerIds.filter(id => {
      try {
        return mongoose.Types.ObjectId.isValid(id);
      } catch (err) {
        return false;
      }
    });
    
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid MongoDB ObjectIds provided' });
    }
    
    // Limit to comparing max 4 players at once
    playerIds = validIds.slice(0, 4);
    
    console.log('Comparing players with IDs:', playerIds);
    
    // Get player profiles
    const playerProfiles = await User.find({ _id: { $in: playerIds } })
      .select('-password -passwordResetToken -passwordResetExpires');
    
    if (playerProfiles.length === 0) {
      return res.status(404).json({ message: 'No players found with the provided IDs' });
    }
    
    // Get detailed stats for each player
    const playerStats = await Promise.all(
      playerProfiles.map(async (player) => {
        // Get all player stats
        const allStats = await PlayerStat.find({ player: player._id });
        
        // Calculate detailed stats
        const battingStats = {
          totalRuns: player.stats?.runs || 0,
          highestScore: 0,
          battingAverage: player.stats?.battingAvg || 0,
          strikeRate: 0,
          fifties: 0,
          hundreds: 0
        };
        
        const bowlingStats = {
          totalWickets: player.stats?.wickets || 0,
          bestFigures: '0/0',
          bowlingAverage: player.stats?.bowlingAvg || 0,
          economy: 0
        };
        
        // Process all stats to calculate detailed metrics
        let totalBattingRuns = 0;
        let totalBattingBalls = 0;
        let bestWickets = 0;
        let bestRuns = Infinity;
        
        if (allStats && allStats.length > 0) {
          allStats.forEach(stat => {
            // Batting stats
            if (stat.batting?.runs > battingStats.highestScore) {
              battingStats.highestScore = stat.batting.runs;
            }
            
            if (stat.batting?.runs >= 50 && stat.batting?.runs < 100) {
              battingStats.fifties++;
            }
            
            if (stat.batting?.runs >= 100) {
              battingStats.hundreds++;
            }
            
            totalBattingRuns += stat.batting?.runs || 0;
            totalBattingBalls += stat.batting?.balls || 0;
            
            // Bowling stats
            if (stat.bowling?.wickets > bestWickets || 
                (stat.bowling?.wickets === bestWickets && stat.bowling?.runs < bestRuns)) {
              bestWickets = stat.bowling?.wickets || 0;
              bestRuns = stat.bowling?.runs || 0;
              bowlingStats.bestFigures = `${bestWickets}/${bestRuns}`;
            }
          });
          
          // Calculate strike rate
          battingStats.strikeRate = totalBattingBalls > 0 ? 
            ((totalBattingRuns / totalBattingBalls) * 100).toFixed(2) : '0.00';
          
          // Calculate economy
          const totalOvers = allStats.reduce((sum, stat) => sum + (stat.bowling?.overs || 0), 0);
          const totalRuns = allStats.reduce((sum, stat) => sum + (stat.bowling?.runs || 0), 0);
          
          bowlingStats.economy = totalOvers > 0 ? 
            (totalRuns / totalOvers).toFixed(2) : '0.00';
        }
        
        // Get coach's rating for this player
        const rating = await PlayerRating.findOne({
          coach: req.userId,
          player: player._id
        });
        
        // Return player with detailed stats
        return {
          profile: player.toPublicJSON(),
          battingStats,
          bowlingStats,
          rating: rating ? {
            overall: rating.overall,
            batting: rating.batting,
            bowling: rating.bowling,
            fielding: rating.fielding,
            fitness: rating.fitness
          } : null
        };
      })
    );
    
    res.json(playerStats);
  } catch (err) {
    console.error('Error comparing players:', err);
    res.status(500).json({ message: 'Server error comparing players' });
  }
};

// @route   GET api/coaches/export/watchlist
// @desc    Export watchlist data as JSON
// @access  Private (Coach/Scout)
exports.exportWatchlist = async (req, res) => {
  try {
    const coachId = req.userId;
    
    // Get watchlist items with player details
    const watchlist = await Watchlist.find({ coach: coachId })
      .populate({
        path: 'player',
        select: '-password -passwordResetToken -passwordResetExpires'
      })
      .sort({ createdAt: -1 });
    
    // Format data for export
    const exportData = watchlist.map(item => {
      const player = item.player;
      
      return {
        name: player.name,
        age: player.age,
        school: player.school,
        district: player.district,
        stats: {
          matches: player.stats.matches,
          runs: player.stats.runs,
          wickets: player.stats.wickets,
          battingAvg: player.stats.battingAvg,
          bowlingAvg: player.stats.bowlingAvg
        },
        notes: item.notes,
        addedAt: item.createdAt
      };
    });
    
    res.json(exportData);
  } catch (err) {
    console.error('Error exporting watchlist:', err);
    res.status(500).json({ message: 'Server error exporting watchlist' });
  }
};

// @route   GET api/coaches/dashboard
// @desc    Get coach dashboard data
// @access  Private (Coach/Scout)
exports.getDashboardData = async (req, res) => {
  try {
    const coachId = req.userId;
    
    // Get coach profile
    const coach = await User.findById(coachId);
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    
    // Get watchlist count
    const watchlistCount = await Watchlist.countDocuments({ coach: coachId });
    
    // Get ratings count
    const ratingsCount = await PlayerRating.countDocuments({ coach: coachId });
    
    // Get recently rated players
    const recentRatings = await PlayerRating.find({ coach: coachId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate({
        path: 'player',
        select: 'name profileImage stats'
      });
    
    // Get recently added watchlist players
    const recentWatchlist = await Watchlist.find({ coach: coachId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'player',
        select: 'name profileImage stats'
      });
    
    // Format recent ratings
    const formattedRatings = recentRatings.map(rating => {
      return {
        id: rating._id,
        player: {
          id: rating.player._id,
          name: rating.player.name,
          profileImage: rating.player.profileImage,
          stats: rating.player.stats
        },
        overall: rating.overall,
        updatedAt: rating.updatedAt
      };
    });
    
    // Format recent watchlist
    const formattedWatchlist = recentWatchlist.map(item => {
      return {
        id: item._id,
        player: {
          id: item.player._id,
          name: item.player.name,
          profileImage: item.player.profileImage,
          stats: item.player.stats
        },
        addedAt: item.createdAt
      };
    });
    
    res.json({
      coach: {
        name: coach.name,
        email: coach.email,
        organization: coach.organization,
        position: coach.position,
        profileImage: coach.profileImage
      },
      stats: {
        watchlistCount,
        ratingsCount
      },
      recentRatings: formattedRatings,
      recentWatchlist: formattedWatchlist
    });
  } catch (err) {
    console.error('Error fetching coach dashboard data:', err);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
};

// @route   POST api/coaches/players/:id/feedback
// @desc    Send feedback to a player
// @access  Private (Coach/Scout)
exports.sendPlayerFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const playerId = req.params.id;
    const coachId = req.userId;
    
    const { feedback, category } = req.body;
    
    // Check if player exists
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Create new feedback
    const newFeedback = new CoachFeedback({
      coach: coachId,
      player: playerId,
      feedback,
      category: category || 'general'
    });
    
    await newFeedback.save();
    
    // Populate coach info for the response
    const populatedFeedback = await CoachFeedback.findById(newFeedback._id)
      .populate('coach', 'name profileImage');
    
    // Emit socket event for real-time notification
    if (req.io) {
      req.io.to(`user-${playerId}`).emit('new-feedback', populatedFeedback);
    }
    
    res.json(populatedFeedback);
  } catch (err) {
    console.error('Error sending player feedback:', err);
    res.status(500).json({ message: 'Server error sending player feedback' });
  }
};

// @route   GET api/coaches/players/:id/feedback
// @desc    Get feedback history for a player
// @access  Private (Coach/Scout)
exports.getPlayerFeedbackHistory = async (req, res) => {
  try {
    const playerId = req.params.id;
    const coachId = req.userId;
    
    // Check if player exists
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Get feedback history
    const feedback = await CoachFeedback.find({
      coach: coachId,
      player: playerId
    })
    .sort({ createdAt: -1 })
    .populate('coach', 'name profileImage');
    
    res.json(feedback);
  } catch (err) {
    console.error('Error fetching player feedback history:', err);
    res.status(500).json({ message: 'Server error fetching feedback history' });
  }
};

// @route   GET api/coaches/me
// @desc    Get current coach's profile
// @access  Private (Coach/Scout)
exports.getCoachProfile = async (req, res) => {
  try {
    const coach = await User.findById(req.userId);
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    console.log('Coach profile fetched, dateOfBirth:', coach.dateOfBirth);

    // Return coach profile data
    res.json({
      id: coach._id,
      name: coach.name,
      email: coach.email,
      organization: coach.organization,
      position: coach.position,
      bio: coach.bio,
      phone: coach.phone,
      experience: coach.experience,
      specialization: coach.specialization,
      profileImage: coach.profileImage,
      dateOfBirth: coach.dateOfBirth,
      district: coach.district,
      socialMedia: coach.socialMedia || {}
    });
  } catch (err) {
    console.error('Error fetching coach profile:', err);
    res.status(500).json({ message: 'Server error fetching coach profile' });
  }
};

// @route   PUT api/coaches/me
// @desc    Update current coach's profile
// @access  Private (Coach/Scout)
exports.updateCoachProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    organization,
    position,
    bio,
    phone,
    experience,
    specialization,
    socialMedia,
    dateOfBirth,
    district
  } = req.body;

  try {
    // Build coach profile object
    const coachFields = {};
    
    if (name) coachFields.name = name;
    if (organization) coachFields.organization = organization;
    if (position) coachFields.position = position;
    if (bio) coachFields.bio = bio;
    if (phone) coachFields.phone = phone;
    if (experience) coachFields.experience = experience;
    if (specialization) coachFields.specialization = specialization;
    if (district) coachFields.district = district;
    
    // Handle dateOfBirth field
    if (dateOfBirth) {
      console.log('Received dateOfBirth:', dateOfBirth);
      try {
        // For raw date strings in YYYY-MM-DD format
        if (typeof dateOfBirth === 'string' && dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log('Raw date string in YYYY-MM-DD format detected');
          // Create date with proper timezone handling
          const [year, month, day] = dateOfBirth.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
          
          if (!isNaN(dateObj.getTime())) {
            coachFields.dateOfBirth = dateObj;
            console.log('Parsed dateOfBirth from raw string:', dateObj);
          } else {
            console.log('Invalid date created from raw string:', dateOfBirth);
          }
        } 
        // For ISO strings or other date formats
        else {
          const dateObj = new Date(dateOfBirth);
          if (!isNaN(dateObj.getTime())) {
            coachFields.dateOfBirth = dateObj;
            console.log('Parsed dateOfBirth from other format:', dateObj);
          } else {
            console.log('Invalid date format received:', dateOfBirth);
          }
        }
      } catch (dateErr) {
        console.error('Error parsing date:', dateErr);
      }
    } else {
      console.log('No dateOfBirth field in request');
    }
    
    // Social media fields
    if (socialMedia) {
      coachFields.socialMedia = {};
      if (socialMedia.facebook) coachFields.socialMedia.facebook = socialMedia.facebook;
      if (socialMedia.twitter) coachFields.socialMedia.twitter = socialMedia.twitter;
      if (socialMedia.instagram) coachFields.socialMedia.instagram = socialMedia.instagram;
      if (socialMedia.linkedin) coachFields.socialMedia.linkedin = socialMedia.linkedin;
    }

    // Update coach profile
    const coach = await User.findByIdAndUpdate(
      req.userId,
      { $set: coachFields },
      { new: true }
    );

    console.log('Coach profile updated, dateOfBirth:', coach.dateOfBirth);

    res.json({
      id: coach._id,
      name: coach.name,
      email: coach.email,
      organization: coach.organization,
      position: coach.position,
      bio: coach.bio,
      phone: coach.phone,
      experience: coach.experience,
      specialization: coach.specialization,
      profileImage: coach.profileImage,
      dateOfBirth: coach.dateOfBirth,
      district: coach.district,
      socialMedia: coach.socialMedia || {}
    });
  } catch (err) {
    console.error('Error updating coach profile:', err);
    res.status(500).json({ message: 'Server error updating coach profile' });
  }
};

// @route   PUT api/coaches/me/profile-image
// @desc    Update coach profile image
// @access  Private (Coach/Scout)
exports.updateCoachProfileImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
    // Validate that it's a base64 image
    if (!imageUrl.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format' });
    }
    
    // Validate image size (roughly)
    const approximateSize = Math.ceil((imageUrl.length * 3) / 4);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (approximateSize > maxSize) {
      return res.status(400).json({ message: 'Image too large. Maximum size is 5MB' });
    }
    
    // Store the data URL directly
    const coach = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profileImage: imageUrl } },
      { new: true }
    );
    
    // Add CORS headers specifically for this response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    res.json({ 
      profileImage: coach.profileImage,
      message: 'Profile image updated successfully'
    });
  } catch (err) {
    console.error('Error updating profile image:', err);
    res.status(500).json({ message: 'Server error updating profile image' });
  }
};

// @route   POST api/coaches/me/profile-image/upload
// @desc    Upload coach profile image (multipart form)
// @access  Private (Coach/Scout)
exports.uploadCoachProfileImage = async (req, res) => {
  try {
    console.log('Upload request received, userId:', req.userId);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('File uploaded:', req.file);
    console.log('File details - filename:', req.file.filename, 'size:', req.file.size, 'mimetype:', req.file.mimetype);
    
    // Read the file and convert to data URL
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    console.log('File path:', filePath);
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log('File not found at path:', filePath);
        return res.status(404).json({ message: 'Uploaded file not found' });
      }
      
      console.log('File exists, reading file...');
      
      // Read the file as binary data
      const imageBuffer = fs.readFileSync(filePath);
      console.log('File read successfully, buffer size:', imageBuffer.length);
      
      // Convert to base64
      const base64Image = imageBuffer.toString('base64');
      console.log('Converted to base64, length:', base64Image.length);
      
      // Create data URL with appropriate MIME type
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      console.log('Data URL created (truncated):', dataUrl.substring(0, 50) + '...');
      
      // Update user profile with data URL
      console.log('Updating user profile with data URL...');
      const coach = await User.findByIdAndUpdate(
        req.userId,
        { $set: { profileImage: dataUrl } },
        { new: true }
      );
      
      console.log('User profile updated successfully');
      
      // Clean up the file since we don't need it anymore
      fs.unlinkSync(filePath);
      console.log('Temporary file deleted');
      
      // Add CORS headers specifically for this response
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');

      console.log('Sending successful response');
      res.json({ 
        profileImage: coach.profileImage,
        message: 'Profile image uploaded successfully' 
      });
    } catch (fsError) {
      console.error('Error processing file:', fsError);
      
      // Fallback to URL method if file processing fails
      console.log('Falling back to URL method');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      console.log('Fallback URL:', imageUrl);

      // Update user profile with image URL
      console.log('Updating user profile with URL...');
      const coach = await User.findByIdAndUpdate(
        req.userId,
        { $set: { profileImage: imageUrl } },
        { new: true }
      );

      console.log('Sending fallback response');
      res.json({ 
        profileImage: coach.profileImage,
        message: 'Profile image uploaded successfully (URL method)' 
      });
    }
  } catch (err) {
    console.error('Error uploading profile image:', err);
    res.status(500).json({ message: 'Server error uploading profile image' });
  }
};

module.exports = exports; 