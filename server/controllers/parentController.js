const { User } = require('../models/User');
const { ParentPlayer } = require('../models/ParentPlayer');
const { ParentEngagement } = require('../models/ParentEngagement');
const { PlayerStat } = require('../models/PlayerStat');
const { CoachFeedback } = require('../models/CoachFeedback');
const { Achievement } = require('../models/Achievement');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Media = require('../models/Media');

// @route   GET api/parents/dashboard
// @desc    Get parent dashboard data
// @access  Private (Parent)
exports.getDashboardData = async (req, res) => {
  try {
    console.log('Fetching dashboard data for parent:', req.userId);
    
    // Get parent user
    const parent = await User.findById(req.userId);
    if (!parent) {
      console.log(`Parent user not found: ${req.userId}`);
      return res.status(404).json({ message: 'Parent user not found' });
    }
    
    // Get linked players (children)
    const parentPlayerLinks = await ParentPlayer.find({ 
      parent: req.userId,
      isVerified: true
    }).populate({
      path: 'player',
      select: 'name school district dateOfBirth profileImage stats'
    });
    
    console.log(`Found ${parentPlayerLinks.length} linked children for parent ${req.userId}`);
    
    if (parentPlayerLinks.length === 0) {
      console.log(`No linked children found for parent ${req.userId}, returning empty dashboard`);
      return res.json({
        parent: parent,
        children: [],
        recentStats: [],
        recentFeedback: [],
        recentEngagements: []
      });
    }
    
    // Extract player IDs
    const playerIds = parentPlayerLinks.map(link => {
      if (!link.player) {
        console.warn(`Warning: Found a link without player data: ${link._id}`);
        return null;
      }
      return link.player._id;
    }).filter(id => id !== null);
    
    if (playerIds.length === 0) {
      console.log(`No valid player IDs found for parent ${req.userId}, returning empty dashboard`);
      return res.json({
        parent: parent,
        children: [],
        recentStats: [],
        recentFeedback: [],
        recentEngagements: []
      });
    }
    
    console.log(`Fetching recent stats, feedback and engagements for players: ${playerIds.join(', ')}`);
    
    // Get recent activities (stats, achievements)
    let recentStats = [];
    try {
      recentStats = await PlayerStat.find({ player: { $in: playerIds } })
        .sort({ 'match.date': -1 })
        .limit(5)
        .populate('player', 'name profileImage');
      
      console.log(`Found ${recentStats.length} recent stats`);
    } catch (statsErr) {
      console.error('Error fetching recent stats:', statsErr);
      recentStats = [];
    }
    
    // Get recent feedback
    let recentFeedback = [];
    try {
      recentFeedback = await CoachFeedback.find({ player: { $in: playerIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('player', 'name profileImage')
        .populate('coach', 'name role');
      
      console.log(`Found ${recentFeedback.length} recent feedback items`);
    } catch (feedbackErr) {
      console.error('Error fetching recent feedback:', feedbackErr);
      recentFeedback = [];
    }
    
    // Get recent engagements
    let recentEngagements = [];
    try {
      recentEngagements = await ParentEngagement.find({ parent: req.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('player', 'name profileImage');
      
      console.log(`Found ${recentEngagements.length} recent engagements`);
    } catch (engagementErr) {
      console.error('Error fetching recent engagements:', engagementErr);
      recentEngagements = [];
    }
    
    // Filter out any children with null data
    const validChildren = parentPlayerLinks
      .filter(link => link.player)
      .map(link => link.player);
    
    console.log(`Returning dashboard data with ${validChildren.length} children`);
    
    res.json({
      parent: parent,
      children: validChildren,
      recentStats,
      recentFeedback,
      recentEngagements
    });
  } catch (err) {
    console.error('Error fetching parent dashboard data:', err);
    res.status(500).json({ 
      message: 'Server error fetching parent dashboard data',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @route   GET api/parents/children
// @desc    Get parent's children (players)
// @access  Private (Parent)
exports.getChildren = async (req, res) => {
  try {
    const parentPlayerLinks = await ParentPlayer.find({ 
      parent: req.userId,
      isVerified: true
    }).populate({
      path: 'player',
      select: 'name school district dateOfBirth profileImage stats'
    });
    
    const children = parentPlayerLinks.map(link => ({
      ...link.player.toObject(),
      relationship: link.relationship
    }));
    
    res.json(children);
  } catch (err) {
    console.error('Error fetching parent\'s children:', err);
    res.status(500).json({ message: 'Server error fetching parent\'s children' });
  }
};

// @route   GET api/parents/children/:playerId
// @desc    Get specific child's details
// @access  Private (Parent)
exports.getChildDetails = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Verify parent has access to this player
    const parentPlayerLink = await ParentPlayer.findOne({ 
      parent: req.userId,
      player: playerId,
      isVerified: true
    });
    
    if (!parentPlayerLink) {
      return res.status(403).json({ message: 'You do not have access to this player\'s data' });
    }
    
    // Get player details
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Get player's stats
    const stats = await PlayerStat.find({ player: playerId })
      .sort({ 'match.date': -1 })
      .limit(10);
    
    // Get coach feedback
    const feedback = await CoachFeedback.find({ player: playerId })
      .sort({ createdAt: -1 })
      .populate('coach', 'name role profileImage');
    
    // Get achievements
    const achievements = await Achievement.find({ player: playerId })
      .sort({ createdAt: -1 });
    
    res.json({
      player: player.toPublicJSON(),
      stats,
      feedback,
      achievements,
      relationship: parentPlayerLink.relationship
    });
  } catch (err) {
    console.error('Error fetching child details:', err);
    res.status(500).json({ message: 'Server error fetching child details' });
  }
};

// @route   POST api/parents/link-player
// @desc    Link parent to player using access code
// @access  Private (Parent)
exports.linkPlayer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { accessCode, relationship } = req.body;
  
  try {
    // Find the parent-player link with this access code
    const parentPlayerLink = await ParentPlayer.findOne({ accessCode });
    
    if (!parentPlayerLink) {
      return res.status(400).json({ message: 'Invalid access code' });
    }
    
    // Check if this link was already created for another parent
    if (parentPlayerLink.isVerified && parentPlayerLink.parent.toString() !== req.userId) {
      return res.status(400).json({ message: 'This access code has already been used' });
    }
    
    // Update the link with parent ID and mark as verified
    parentPlayerLink.parent = req.userId;
    parentPlayerLink.relationship = relationship || 'parent';
    parentPlayerLink.isVerified = true;
    parentPlayerLink.verifiedAt = new Date();
    
    await parentPlayerLink.save();
    
    // Get player details
    const player = await User.findById(parentPlayerLink.player).select('name school district profileImage');
    
    res.json({
      message: 'Successfully linked to player',
      player,
      relationship: parentPlayerLink.relationship
    });
  } catch (err) {
    console.error('Error linking parent to player:', err);
    res.status(500).json({ message: 'Server error linking parent to player' });
  }
};

// @route   POST api/parents/generate-access-code
// @desc    Generate access code for parent (Player generates this)
// @access  Private (Player)
exports.generateAccessCode = async (req, res) => {
  try {
    console.log('Generate access code request from user:', req.userId, 'with role:', req.userRole);
    
    // Double check that the user is a player
    if (req.userRole !== 'player') {
      console.log('Access denied: User role is not player but', req.userRole);
      return res.status(403).json({ message: 'Only players can generate access codes for parents' });
    }
    
    // Generate a unique 6-character alphanumeric code
    const generateCode = () => {
      return crypto.randomBytes(3).toString('hex').toUpperCase();
    };
    
    let accessCode = generateCode();
    let existingLink = await ParentPlayer.findOne({ accessCode });
    
    // Ensure code is unique
    while (existingLink) {
      accessCode = generateCode();
      existingLink = await ParentPlayer.findOne({ accessCode });
    }
    
    // Create a new parent-player link
    const parentPlayerLink = new ParentPlayer({
      player: req.userId, // Player is generating this code
      accessCode,
      // Parent will be set when a parent uses this code
      // No need to set parent field now since we updated the model
      isVerified: false
    });
    
    await parentPlayerLink.save();
    console.log('Access code generated successfully for player:', req.userId);
    
    res.json({
      accessCode,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    });
  } catch (err) {
    console.error('Error generating access code:', err);
    res.status(500).json({ message: 'Server error generating access code' });
  }
};

// @route   POST api/parents/engagement
// @desc    Create parent engagement (reaction, comment, sticker)
// @access  Private (Parent)
exports.createEngagement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors in createEngagement:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      playerId, 
      contentType, 
      contentId, 
      engagementType, 
      reactionType, 
      stickerType, 
      comment 
    } = req.body;
    
    console.log(`Creating engagement: parent=${req.userId}, player=${playerId}, type=${engagementType}, contentType=${contentType}, contentId=${contentId || 'not provided'}`);
    
    // Verify parent has access to this player
    const parentPlayerLink = await ParentPlayer.findOne({ 
      parent: req.userId,
      player: playerId,
      isVerified: true
    });
    
    if (!parentPlayerLink) {
      console.log(`Access denied: Parent ${req.userId} does not have verified access to player ${playerId}`);
      return res.status(403).json({ message: 'You do not have access to this player\'s data' });
    }
    
    // Validate that the player exists
    const playerExists = await User.exists({ _id: playerId });
    if (!playerExists) {
      console.log(`Player not found: ${playerId}`);
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Handle content validation based on content type
    let contentExists = false;
    let finalContentId = contentId;
    
    // For general type, we don't need to validate the contentId
    if (contentType === 'general') {
      contentExists = true;
      // Generate a unique ID for each general engagement instead of using a placeholder
      finalContentId = new mongoose.Types.ObjectId().toString();
      console.log('Using general content type with unique ID:', finalContentId);
    } else {
      try {
        if (contentType === 'stat') {
          // Check if the stat exists
          const statExists = await PlayerStat.exists({ _id: contentId });
          contentExists = !!statExists;
          console.log(`Stat validation result: ${contentExists ? 'found' : 'not found'}`);
        } else if (contentType === 'achievement') {
          const achievementExists = await Achievement.exists({ _id: contentId });
          contentExists = !!achievementExists;
          console.log(`Achievement validation result: ${contentExists ? 'found' : 'not found'}`);
        } else if (contentType === 'feedback') {
          const feedbackExists = await CoachFeedback.exists({ _id: contentId });
          contentExists = !!feedbackExists;
          console.log(`Feedback validation result: ${contentExists ? 'found' : 'not found'}`);
        } else if (contentType === 'match') {
          // For match type, we just validate the ObjectId format
          contentExists = mongoose.Types.ObjectId.isValid(contentId);
          console.log(`Match ID validation result: ${contentExists ? 'valid format' : 'invalid format'}`);
        }
        
        // If content doesn't exist but we're in development, allow it for testing
        if (!contentExists && process.env.NODE_ENV === 'development') {
          console.log(`Warning: Content ${contentId} of type ${contentType} not found, but allowing in development mode`);
          contentExists = true;
        }
      } catch (contentErr) {
        console.error(`Error validating content: ${contentErr.message}`);
        console.error(contentErr.stack);
        // Continue anyway - we'll create a generic engagement
        contentExists = true;
      }
    }
    
    if (!contentExists) {
      console.log(`Content not found: ${contentType} with ID ${contentId}`);
      return res.status(404).json({ message: `The ${contentType} you're trying to engage with doesn't exist` });
    }
    
    // Validate that required fields are present based on engagement type
    if (engagementType === 'reaction' && !reactionType) {
      return res.status(400).json({ message: 'Reaction type is required for reaction engagements' });
    }
    
    if (engagementType === 'sticker' && !stickerType) {
      return res.status(400).json({ message: 'Sticker type is required for sticker engagements' });
    }
    
    if (engagementType === 'comment' && (!comment || comment.trim() === '')) {
      return res.status(400).json({ message: 'Comment is required for comment engagements' });
    }
    
    // Create the engagement object with proper handling for contentId
    const engagementData = {
      parent: req.userId,
      player: playerId,
      contentType,
      engagementType,
      reactionType,
      stickerType,
      comment
    };
    
    // Only add contentId if it's provided or we're using a placeholder
    if (finalContentId) {
      try {
        engagementData.contentId = new mongoose.Types.ObjectId(finalContentId);
      } catch (err) {
        console.error('Error converting contentId to ObjectId:', err);
        // Generate a new ObjectId instead of using a placeholder
        engagementData.contentId = new mongoose.Types.ObjectId();
      }
    } else if (contentType === 'general') {
      // Always ensure general type has a unique ID
      engagementData.contentId = new mongoose.Types.ObjectId();
    }
    
    console.log('Creating engagement with data:', JSON.stringify(engagementData));
    
    try {
      // Create the engagement
      const engagement = new ParentEngagement(engagementData);
      
      // Save the engagement
      await engagement.save();
      console.log(`Engagement created successfully with ID: ${engagement._id}`);
      
      // Populate the engagement with parent info
      const populatedEngagement = await ParentEngagement.findById(engagement._id)
        .populate('parent', 'name profileImage');
      
      // Get the parent name for notification
      const parent = await User.findById(req.userId).select('name');
      const parentName = parent ? parent.name : 'A parent';
      
      // Send notification to the player using Socket.IO
      try {
        // Try to get io from req or req.app
        const io = req.io || req.app.get('io');
        
        if (!io) {
          console.error('Socket.IO not available: io object is undefined');
          throw new Error('Socket.IO not available');
        }
        
        console.log(`Emitting new_parent_engagement event to user-${playerId}`);
        
        // Create notification data with proper reaction type
        let reactionMessage;
        if (engagementType === 'reaction') {
          if (reactionType === 'love') {
            reactionMessage = `${parentName} sent you love!`;
          } else if (reactionType === 'proud') {
            reactionMessage = `${parentName} is proud of you!`;
          } else if (reactionType === 'encouragement') {
            reactionMessage = `${parentName} is encouraging you!`;
          } else {
            reactionMessage = `${parentName} sent you a reaction!`;
          }
        } else if (engagementType === 'sticker') {
          reactionMessage = `${parentName} sent you a ${stickerType} sticker!`;
        } else {
          reactionMessage = `${parentName} commented on your profile!`;
        }
        
        const notificationData = {
          engagement: populatedEngagement,
          message: reactionMessage,
          type: 'parent_engagement',
          timestamp: new Date()
        };
        
        // Try using the new sendUserNotification helper if available
        const sendNotification = req.app.get('sendUserNotification');
        if (typeof sendNotification === 'function') {
          console.log('Using sendUserNotification helper for reliable delivery');
          sendNotification(playerId, 'new_parent_engagement', notificationData);
        } else {
          // Fall back to traditional room-based delivery
          console.log('Using traditional socket.io room delivery');
          
          // Debug socket rooms
          const rooms = io.sockets.adapter.rooms;
          const userRoom = `user-${playerId}`;
          const roomExists = rooms.has(userRoom);
          console.log(`Checking if room ${userRoom} exists:`, roomExists);
          
          if (!roomExists) {
            console.log(`Room ${userRoom} doesn't exist, will broadcast anyway`);
          }
          
          // Send to player's personal room
          io.to(userRoom).emit('new_parent_engagement', notificationData);
        }
        
        console.log('Notification sent successfully with message:', reactionMessage);
        
        // Return success response
        return res.status(200).json(populatedEngagement);
      } catch (socketError) {
        // Don't fail the request if socket notification fails
        console.error('Error sending socket notification:', socketError);
        console.error(socketError.stack);
        
        // Still return success since the engagement was created
        return res.status(200).json({ 
          ...populatedEngagement.toObject(), 
          warning: 'Engagement created but notification may not have been sent' 
        });
      }
    } catch (saveErr) {
      console.error('Error saving engagement:', saveErr);
      
      if (saveErr.name === 'ValidationError') {
        // Handle validation errors
        const validationErrors = Object.values(saveErr.errors).map(err => err.message);
        console.error('Validation errors:', validationErrors);
        return res.status(400).json({ 
          message: 'Validation error creating parent engagement',
          errors: validationErrors
        });
      }
      
      throw saveErr; // Rethrow for the outer catch block
    }
  } catch (err) {
    console.error('Error creating engagement:', err);
    console.error(err.stack);
    return res.status(500).json({ message: 'Server error creating engagement' });
  }
};

// @route   GET api/parents/engagements/:playerId
// @desc    Get parent engagements for a specific player
// @access  Private (Parent)
exports.getEngagements = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Verify parent has access to this player
    const parentPlayerLink = await ParentPlayer.findOne({ 
      parent: req.userId,
      player: playerId,
      isVerified: true
    });
    
    if (!parentPlayerLink) {
      return res.status(403).json({ message: 'You do not have access to this player\'s data' });
    }
    
    // Get engagements
    const engagements = await ParentEngagement.find({
      parent: req.userId,
      player: playerId
    })
    .sort({ createdAt: -1 })
    .populate('parent', 'name profileImage');
    
    res.json(engagements);
  } catch (err) {
    console.error('Error fetching parent engagements:', err);
    res.status(500).json({ message: 'Server error fetching parent engagements' });
  }
};

// @route   GET api/parents/feedback/:playerId
// @desc    Get coach feedback for a specific player
// @access  Private (Parent)
exports.getCoachFeedback = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Verify parent has access to this player
    const parentPlayerLink = await ParentPlayer.findOne({ 
      parent: req.userId,
      player: playerId,
      isVerified: true
    });
    
    if (!parentPlayerLink) {
      return res.status(403).json({ message: 'You do not have access to this player\'s data' });
    }
    
    // Get coach feedback
    const feedback = await CoachFeedback.find({ player: playerId })
      .sort({ createdAt: -1 })
      .populate('coach', 'name role profileImage');
    
    res.json(feedback);
  } catch (err) {
    console.error('Error fetching coach feedback:', err);
    res.status(500).json({ message: 'Server error fetching coach feedback' });
  }
};

// @route   GET api/parents/stats/:playerId
// @desc    Get match stats for a specific player
// @access  Private (Parent)
exports.getPlayerStats = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Verify parent has access to this player
    const parentPlayerLink = await ParentPlayer.findOne({ 
      parent: req.userId,
      player: playerId,
      isVerified: true
    });
    
    if (!parentPlayerLink) {
      return res.status(403).json({ message: 'You do not have access to this player\'s data' });
    }
    
    // Get player stats
    const stats = await PlayerStat.find({ player: playerId })
      .sort({ 'match.date': -1 });
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching player stats:', err);
    res.status(500).json({ message: 'Server error fetching player stats' });
  }
};

// @route   GET api/parents/media/:playerId
// @desc    Get child's media (both public and private)
// @access  Private (Parent)
exports.getChildMedia = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Verify parent has access to this player
    const parentPlayerLink = await ParentPlayer.findOne({ 
      parent: req.userId,
      player: playerId,
      isVerified: true
    });
    
    if (!parentPlayerLink) {
      return res.status(403).json({ message: 'You do not have access to this player\'s media' });
    }
    
    // Get all media for the player (both public and private)
    const media = await Media.find({ 
      user: playerId,
      isApproved: { $ne: false } // Exclude rejected media
    }).sort({ createdAt: -1 });
    
    // Add file URLs to each media item for proper display
    const mediaWithUrls = media.map(item => {
      const itemObj = item.toObject();
      itemObj.fileUrl = `/uploads/${item.filePath}`;
      return itemObj;
    });
    
    res.json(mediaWithUrls);
  } catch (err) {
    console.error('Error fetching child media:', err);
    res.status(500).json({ message: 'Server error fetching child media' });
  }
}; 