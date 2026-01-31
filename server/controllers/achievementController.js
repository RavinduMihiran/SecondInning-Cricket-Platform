const { Achievement } = require('../models/Achievement');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @route   GET api/achievements/player/:playerId
// @desc    Get all achievements for a player
// @access  Public
exports.getPlayerAchievements = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { category, tier } = req.query;
    
    // Build filter
    const filter = { player: playerId };
    if (category) filter.category = category;
    if (tier) filter.tier = tier;
    
    const achievements = await Achievement.find(filter)
      .sort({ achievementDate: -1 })
      .populate('match', 'match.opponent match.venue match.date match.format');
    
    res.json(achievements);
  } catch (err) {
    console.error('Error getting player achievements:', err);
    res.status(500).json({ message: 'Server error while fetching achievements' });
  }
};

// @route   GET api/achievements/:id
// @desc    Get achievement by ID
// @access  Public
exports.getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid achievement ID format' });
    }
    
    const achievement = await Achievement.findById(id)
      .populate('match', 'match.opponent match.venue match.date match.format')
      .populate('player', 'name profileImage');
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    res.json(achievement);
  } catch (err) {
    console.error('Error getting achievement:', err);
    res.status(500).json({ message: 'Server error while fetching achievement' });
  }
};

// @route   POST api/achievements
// @desc    Add a new achievement (for admins/coaches)
// @access  Private (Admin/Coach only)
exports.addAchievement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      player,
      title,
      description,
      category,
      achievementDate,
      match,
      opponent,
      venue,
      value,
      badgeImage,
      tier,
      isPublic
    } = req.body;

    // Create a new achievement
    const achievement = new Achievement({
      player,
      title,
      description,
      category,
      achievementDate: achievementDate || new Date(),
      match,
      opponent,
      venue,
      value,
      badgeImage,
      tier: tier || 'Bronze',
      isPublic: isPublic !== undefined ? isPublic : true,
      verified: true,  // Auto-verified since added by admin/coach
      verifiedBy: req.userId,  // Current user (admin/coach) is verifier
      status: 'approved'  // Auto-approved since added by admin/coach
    });

    await achievement.save();
    res.status(201).json(achievement);
  } catch (err) {
    console.error('Error adding achievement:', err);
    res.status(500).json({ message: 'Server error while adding achievement' });
  }
};

// @route   POST api/achievements/submit
// @desc    Submit an achievement for review (for players)
// @access  Private (Any authenticated user)
exports.submitAchievement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      player,
      title,
      description,
      category,
      achievementDate,
      match,
      opponent,
      venue,
      value,
      tier,
      submissionNotes,
      mediaLinks
    } = req.body;

    // Ensure the submitter can only create achievements for themselves or has proper permissions
    if (req.userRole === 'player' && req.userId.toString() !== player) {
      return res.status(403).json({ message: 'Players can only submit achievements for their own profile' });
    }

    // Create a new achievement with pending status
    const achievement = new Achievement({
      player,
      title,
      description,
      category,
      achievementDate: achievementDate || new Date(),
      match,
      opponent,
      venue,
      value,
      tier: tier || 'Bronze',
      isPublic: false, // Not public until approved
      status: 'pending',
      submittedBy: req.userId,
      submissionNotes,
      mediaLinks,
      verified: false
    });

    await achievement.save();
    res.status(201).json({ 
      achievement,
      message: 'Achievement submitted successfully and is pending admin approval'
    });
  } catch (err) {
    console.error('Error submitting achievement:', err);
    res.status(500).json({ message: 'Server error while submitting achievement' });
  }
};

// @route   GET api/achievements/pending
// @desc    Get all pending achievements (for admin review)
// @access  Private (Admin/Coach only)
exports.getPendingAchievements = async (req, res) => {
  try {
    const pendingAchievements = await Achievement.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('player', 'name profileImage school district')
      .populate('submittedBy', 'name role')
      .populate('match', 'match.opponent match.venue match.date match.format');
    
    res.json(pendingAchievements);
  } catch (err) {
    console.error('Error getting pending achievements:', err);
    res.status(500).json({ message: 'Server error while fetching pending achievements' });
  }
};

// @route   PUT api/achievements/:id/review
// @desc    Review a pending achievement (approve or reject)
// @access  Private (Admin/Coach only)
exports.reviewAchievement = async (req, res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be either approved or rejected' });
  }

  try {
    const achievement = await Achievement.findById(id);
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    if (achievement.status !== 'pending') {
      return res.status(400).json({ message: 'This achievement has already been reviewed' });
    }

    // Update achievement
    achievement.status = status;
    achievement.verified = status === 'approved';
    achievement.verifiedBy = req.userId;
    
    if (status === 'approved') {
      achievement.isPublic = true;
    }
    
    if (feedback) {
      achievement.adminFeedback = feedback;
    }

    await achievement.save();
    
    res.json({ 
      achievement,
      message: `Achievement ${status === 'approved' ? 'approved' : 'rejected'} successfully`
    });
  } catch (err) {
    console.error('Error reviewing achievement:', err);
    res.status(500).json({ message: 'Server error while reviewing achievement' });
  }
};

// @route   PUT api/achievements/:id
// @desc    Update an achievement
// @access  Private (Admin/Coach only)
exports.updateAchievement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      category,
      achievementDate,
      match,
      opponent,
      venue,
      value,
      badgeImage,
      tier,
      isPublic,
      verified
    } = req.body;

    // Find achievement by id
    let achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Update fields
    if (title) achievement.title = title;
    if (description) achievement.description = description;
    if (category) achievement.category = category;
    if (achievementDate) achievement.achievementDate = achievementDate;
    if (match) achievement.match = match;
    if (opponent) achievement.opponent = opponent;
    if (venue) achievement.venue = venue;
    if (value !== undefined) achievement.value = value;
    if (badgeImage) achievement.badgeImage = badgeImage;
    if (tier) achievement.tier = tier;
    if (isPublic !== undefined) achievement.isPublic = isPublic;
    if (verified !== undefined) {
      achievement.verified = verified;
      // If verifying, set the verifiedBy
      if (verified && !achievement.verified) {
        achievement.verifiedBy = req.userId;
      }
    }

    await achievement.save();
    res.json(achievement);
  } catch (err) {
    console.error('Error updating achievement:', err);
    res.status(500).json({ message: 'Server error while updating achievement' });
  }
};

// @route   DELETE api/achievements/:id
// @desc    Delete an achievement
// @access  Private (Admin only)
exports.deleteAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    await achievement.remove();
    res.json({ message: 'Achievement removed' });
  } catch (err) {
    console.error('Error deleting achievement:', err);
    res.status(500).json({ message: 'Server error while deleting achievement' });
  }
};

// @route   GET api/achievements/recent
// @desc    Get recent achievements for all players (for feed)
// @access  Public
exports.getRecentAchievements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const achievements = await Achievement.find({ isPublic: true })
      .sort({ achievementDate: -1 })
      .limit(limit)
      .populate('player', 'name profileImage school district')
      .populate('match', 'match.opponent match.venue match.date match.format');
    
    res.json(achievements);
  } catch (err) {
    console.error('Error getting recent achievements:', err);
    res.status(500).json({ message: 'Server error while fetching recent achievements' });
  }
};

// @route   GET api/achievements/stats/:playerId
// @desc    Get achievement statistics for a player
// @access  Public
exports.getPlayerAchievementStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Validate that playerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: 'Invalid player ID format' });
    }
    
    // Convert string ID to ObjectId
    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    
    // Get counts by category
    const categoryStats = await Achievement.aggregate([
      { $match: { player: playerObjectId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by tier
    const tierStats = await Achievement.aggregate([
      { $match: { player: playerObjectId } },
      { $group: { _id: "$tier", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Total achievements
    const totalAchievements = await Achievement.countDocuments({ player: playerId });
    
    // Recent achievement (latest one)
    const latestAchievement = await Achievement.findOne({ player: playerId })
      .sort({ achievementDate: -1 })
      .populate('match', 'match.opponent match.venue match.date');
    
    res.json({
      total: totalAchievements,
      byCategory: categoryStats,
      byTier: tierStats,
      latest: latestAchievement
    });
  } catch (err) {
    console.error('Error getting player achievement stats:', err);
    res.status(500).json({ message: 'Server error while fetching achievement stats' });
  }
}; 