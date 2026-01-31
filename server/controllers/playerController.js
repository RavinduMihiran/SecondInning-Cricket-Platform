const { User } = require('../models/User');
const { PlayerStat } = require('../models/PlayerStat');
const { Achievement } = require('../models/Achievement');
const { CoachFeedback } = require('../models/CoachFeedback');
const { PlayerRating } = require('../models/PlayerRating');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// @route   GET api/players/:id
// @desc    Get player profile by ID
// @access  Public
exports.getPlayerProfile = async (req, res) => {
  try {
    const player = await User.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Return public profile data
    res.json(player.toPublicJSON());
  } catch (err) {
    console.error('Error fetching player profile:', err);
    res.status(500).json({ message: 'Server error fetching player profile' });
  }
};

// @route   GET api/players/me
// @desc    Get current player's profile
// @access  Private
exports.getCurrentPlayerProfile = async (req, res) => {
  try {
    const player = await User.findById(req.userId);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Return full profile data for the current user
    res.json(player);
  } catch (err) {
    console.error('Error fetching current player profile:', err);
    res.status(500).json({ message: 'Server error fetching current player profile' });
  }
};

// @route   PUT api/players/me
// @desc    Update current player's profile
// @access  Private
exports.updatePlayerProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    school,
    district,
    dateOfBirth,
    bio,
    phone,
    batting,
    bowling,
    interests,
    socialMedia,
    privacySettings
  } = req.body;

  try {
    // Build player profile object
    const playerFields = {};
    
    if (name) playerFields.name = name;
    if (school) playerFields.school = school;
    if (district) playerFields.district = district;
    if (bio) playerFields.bio = bio;
    if (phone) playerFields.phone = phone;
    if (interests) playerFields.interests = interests;
    
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
            playerFields.dateOfBirth = dateObj;
            console.log('Parsed dateOfBirth from raw string:', dateObj);
          } else {
            console.log('Invalid date created from raw string:', dateOfBirth);
          }
        } 
        // For ISO strings or other date formats
        else {
          const dateObj = new Date(dateOfBirth);
          if (!isNaN(dateObj.getTime())) {
            playerFields.dateOfBirth = dateObj;
            console.log('Parsed dateOfBirth from other format:', dateObj);
          } else {
            console.log('Invalid date format received:', dateOfBirth);
          }
        }
      } catch (dateErr) {
        console.error('Error parsing date:', dateErr);
      }
    }
    
    // Social media fields
    if (socialMedia) {
      playerFields.socialMedia = {};
      if (socialMedia.facebook) playerFields.socialMedia.facebook = socialMedia.facebook;
      if (socialMedia.twitter) playerFields.socialMedia.twitter = socialMedia.twitter;
      if (socialMedia.instagram) playerFields.socialMedia.instagram = socialMedia.instagram;
      if (socialMedia.youtube) playerFields.socialMedia.youtube = socialMedia.youtube;
    }
    
    // Privacy settings
    if (privacySettings) {
      playerFields.privacySettings = {};
      if (privacySettings.showEmail !== undefined) playerFields.privacySettings.showEmail = privacySettings.showEmail;
      if (privacySettings.showPhone !== undefined) playerFields.privacySettings.showPhone = privacySettings.showPhone;
      if (privacySettings.showStats !== undefined) playerFields.privacySettings.showStats = privacySettings.showStats;
      if (privacySettings.showMedia !== undefined) playerFields.privacySettings.showMedia = privacySettings.showMedia;
    }

    // Update player profile
    const player = await User.findByIdAndUpdate(
      req.userId,
      { $set: playerFields },
      { new: true }
    );

    console.log('Player profile updated, dateOfBirth:', player.dateOfBirth);
    res.json(player);
  } catch (err) {
    console.error('Error updating player profile:', err);
    res.status(500).json({ message: 'Server error updating player profile' });
  }
};

// @route   GET api/players/me/stats
// @desc    Get current player's detailed stats
// @access  Private
exports.getPlayerDetailedStats = async (req, res) => {
  try {
    const player = await User.findById(req.userId);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Get all player stats
    const allStats = await PlayerStat.find({ player: req.userId })
      .sort({ 'match.date': -1 });
    
    // Calculate detailed stats
    const battingStats = {
      totalRuns: player.stats.runs,
      highestScore: 0,
      battingAverage: player.stats.battingAvg,
      strikeRate: 0,
      fifties: 0,
      hundreds: 0,
      totalBalls: 0,
      totalFours: 0,
      totalSixes: 0
    };
    
    const bowlingStats = {
      totalWickets: player.stats.wickets,
      bestFigures: '0/0',
      bowlingAverage: player.stats.bowlingAvg,
      economy: 0,
      totalOvers: 0,
      totalMaidens: 0,
      totalDotBalls: 0
    };
    
    // Process all stats to calculate detailed metrics
    let totalBattingRuns = 0;
    let totalBattingBalls = 0;
    let bestWickets = 0;
    let bestRuns = 0;
    
    allStats.forEach(stat => {
      // Batting stats
      if (stat.batting.runs > battingStats.highestScore) {
        battingStats.highestScore = stat.batting.runs;
      }
      
      if (stat.batting.runs >= 50 && stat.batting.runs < 100) {
        battingStats.fifties++;
      }
      
      if (stat.batting.runs >= 100) {
        battingStats.hundreds++;
      }
      
      battingStats.totalBalls += stat.batting.balls;
      battingStats.totalFours += stat.batting.fours;
      battingStats.totalSixes += stat.batting.sixes;
      totalBattingRuns += stat.batting.runs;
      totalBattingBalls += stat.batting.balls;
      
      // Bowling stats
      if (stat.bowling.wickets > bestWickets || 
          (stat.bowling.wickets === bestWickets && stat.bowling.runs < bestRuns)) {
        bestWickets = stat.bowling.wickets;
        bestRuns = stat.bowling.runs;
        bowlingStats.bestFigures = `${bestWickets}/${bestRuns}`;
      }
      
      bowlingStats.totalOvers += stat.bowling.overs;
      bowlingStats.totalMaidens += stat.bowling.maidens;
      bowlingStats.totalDotBalls += stat.bowling.dotBalls;
    });
    
    // Calculate strike rate
    battingStats.strikeRate = totalBattingBalls > 0 ? 
      ((totalBattingRuns / totalBattingBalls) * 100).toFixed(2) : 0;
    
    // Calculate economy
    bowlingStats.economy = bowlingStats.totalOvers > 0 ? 
      (allStats.reduce((sum, stat) => sum + stat.bowling.runs, 0) / bowlingStats.totalOvers).toFixed(2) : 0;
    
    // Return detailed stats
    res.json({
      battingStats,
      bowlingStats,
      totalMatches: player.stats.matches
    });
  } catch (err) {
    console.error('Error fetching player detailed stats:', err);
    res.status(500).json({ message: 'Server error fetching player detailed stats' });
  }
};

// @route   GET api/players/search
// @desc    Search players by criteria
// @access  Public
exports.searchPlayers = async (req, res) => {
  try {
    const { query, school, district, role } = req.query;
    
    // Build search filter
    const filter = { role: 'player' };
    
    if (query) {
      filter.$text = { $search: query };
    }
    
    if (school) {
      filter.school = { $regex: school, $options: 'i' };
    }
    
    if (district) {
      filter.district = { $regex: district, $options: 'i' };
    }
    
    // Find players matching criteria
    const players = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .limit(20);
    
    // Map to public JSON
    const publicProfiles = players.map(player => player.toPublicJSON());
    
    res.json(publicProfiles);
  } catch (err) {
    console.error('Error searching players:', err);
    res.status(500).json({ message: 'Server error searching players' });
  }
};

// @route   PUT api/players/me/profile-image
// @desc    Update player profile image
// @access  Private
exports.updateProfileImage = async (req, res) => {
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
    const player = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profileImage: imageUrl } },
      { new: true }
    );
    
    // Add CORS headers specifically for this response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    res.json({ 
      profileImage: player.profileImage,
      message: 'Profile image updated successfully'
    });
  } catch (err) {
    console.error('Error updating profile image:', err);
    res.status(500).json({ message: 'Server error updating profile image' });
  }
};

// @route   POST api/players/me/profile-image/upload
// @desc    Upload player profile image (multipart form)
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Read the file and convert to data URL
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    
    try {
      // Read the file as binary data
      const imageBuffer = fs.readFileSync(filePath);
      // Convert to base64
      const base64Image = imageBuffer.toString('base64');
      // Create data URL with appropriate MIME type
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      
      // Update user profile with data URL
      const player = await User.findByIdAndUpdate(
        req.userId,
        { $set: { profileImage: dataUrl } },
        { new: true }
      );
      
      // Clean up the file since we don't need it anymore
      fs.unlinkSync(filePath);
      
      // Add CORS headers specifically for this response
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');

      res.json({ 
        profileImage: player.profileImage,
        message: 'Profile image uploaded successfully' 
      });
    } catch (fsError) {
      console.error('Error processing file:', fsError);
      
      // Fallback to URL method if file processing fails
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      console.log('Fallback to URL method:', imageUrl);

      // Update user profile with image URL
      const player = await User.findByIdAndUpdate(
        req.userId,
        { $set: { profileImage: imageUrl } },
        { new: true }
      );

      res.json({ 
        profileImage: player.profileImage,
        message: 'Profile image uploaded successfully (URL method)' 
      });
    }
  } catch (err) {
    console.error('Error uploading profile image:', err);
    res.status(500).json({ message: 'Server error uploading profile image' });
  }
};

// @route   GET api/players/me/feedback
// @desc    Get feedback for the current player
// @access  Private
exports.getPlayerFeedback = async (req, res) => {
  try {
    // Get all feedback for the current player
    const feedback = await CoachFeedback.find({ player: req.userId })
      .sort({ createdAt: -1 })
      .populate('coach', 'name profileImage');
    
    res.json(feedback);
  } catch (err) {
    console.error('Error fetching player feedback:', err);
    res.status(500).json({ message: 'Server error fetching player feedback' });
  }
};

// @route   PUT api/players/me/feedback/:id/read
// @desc    Mark feedback as read
// @access  Private
exports.markFeedbackAsRead = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    // Find the feedback and check if it belongs to the current player
    const feedback = await CoachFeedback.findById(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    // Check if the feedback belongs to the current player
    if (feedback.player.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to access this feedback' });
    }
    
    // Mark as read
    feedback.isRead = true;
    await feedback.save();
    
    res.json({ message: 'Feedback marked as read', feedback });
  } catch (err) {
    console.error('Error marking feedback as read:', err);
    res.status(500).json({ message: 'Server error marking feedback as read' });
  }
};

// @route   GET api/players/me/feedback/unread
// @desc    Get count of unread feedback
// @access  Private
exports.getUnreadFeedbackCount = async (req, res) => {
  try {
    // Count unread feedback
    const count = await CoachFeedback.countDocuments({ 
      player: req.userId,
      isRead: false
    });
    
    res.json({ count });
  } catch (err) {
    console.error('Error counting unread feedback:', err);
    res.status(500).json({ message: 'Server error counting unread feedback' });
  }
};

// @route   GET api/players/me/ratings
// @desc    Get current player's ratings from coaches
// @access  Private
exports.getPlayerRatings = async (req, res) => {
  try {
    const playerId = req.userId;
    
    // Get all ratings for this player with coach information
    const ratings = await PlayerRating.find({ player: playerId })
      .populate('coach', 'name profileImage');
    
    if (ratings.length === 0) {
      return res.json({ hasRatings: false });
    }
    
    // Calculate average ratings
    const totalRatings = ratings.length;
    const avgRatings = {
      overall: 0,
      batting: 0,
      bowling: 0,
      fielding: 0,
      fitness: 0,
      lastUpdated: null
    };
    
    // Get the most recent rating date
    let latestDate = new Date(0);
    
    ratings.forEach(rating => {
      avgRatings.overall += rating.overall;
      avgRatings.batting += rating.batting;
      avgRatings.bowling += rating.bowling;
      avgRatings.fielding += rating.fielding;
      avgRatings.fitness += rating.fitness;
      
      // Check if this rating is more recent
      if (rating.updatedAt > latestDate) {
        latestDate = rating.updatedAt;
      }
    });
    
    // Calculate exact averages without rounding to ensure consistency
    avgRatings.overall = Math.round(avgRatings.overall / totalRatings);
    avgRatings.batting = Math.round(avgRatings.batting / totalRatings);
    avgRatings.bowling = Math.round(avgRatings.bowling / totalRatings);
    avgRatings.fielding = Math.round(avgRatings.fielding / totalRatings);
    avgRatings.fitness = Math.round(avgRatings.fitness / totalRatings);
    avgRatings.lastUpdated = latestDate;
    
    // Include the most recent individual rating for reference
    const mostRecentRating = ratings.reduce((latest, current) => {
      return current.updatedAt > latest.updatedAt ? current : latest;
    }, ratings[0]);
    
    res.json({
      hasRatings: true,
      ratings: avgRatings,
      mostRecentRating: {
        overall: mostRecentRating.overall,
        batting: mostRecentRating.batting,
        bowling: mostRecentRating.bowling,
        fielding: mostRecentRating.fielding,
        fitness: mostRecentRating.fitness,
        coachId: mostRecentRating.coach._id,
        coachName: mostRecentRating.coach.name,
        coachImage: mostRecentRating.coach.profileImage,
        lastUpdated: mostRecentRating.updatedAt
      },
      count: totalRatings
    });
  } catch (err) {
    console.error('Error fetching player ratings:', err);
    res.status(500).json({ message: 'Server error fetching player ratings' });
  }
}; 