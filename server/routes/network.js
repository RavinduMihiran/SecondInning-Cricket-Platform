const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { User } = require('../models/User');
const mongoose = require('mongoose');

// @route   GET api/network/coaches
// @desc    Get coaches with optional filters
// @access  Public (temporarily for testing)
router.get('/coaches', async (req, res) => {
  try {
    console.log('Auth token received:', req.header('Authorization'));
    
    const { district, search } = req.query;
    
    // Build query
    const query = { role: 'coach' };
    
    // Add district filter if provided
    if (district && district !== 'All Districts') {
      query.district = district;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Find coaches
    const coaches = await User.find(query)
      .select('name profileImage role district organization position')
      .lean();
    
    // Since we're not authenticating, we'll set isFavorite to false for all coaches
    const coachesWithFavorites = coaches.map(coach => ({
      ...coach,
      isFavorite: false
    }));
    
    res.json(coachesWithFavorites);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/network/scouts
// @desc    Get scouts with optional filters
// @access  Public (temporarily for testing)
router.get('/scouts', async (req, res) => {
  try {
    const { district, search } = req.query;
    
    // Build query
    const query = { role: 'scout' };
    
    // Add district filter if provided
    if (district && district !== 'All Districts') {
      query.district = district;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Find scouts
    const scouts = await User.find(query)
      .select('name profileImage district organization')
      .lean();
    
    // Since we're not authenticating, we'll set connection status to false for all scouts
    const scoutsWithConnectionStatus = scouts.map(scout => ({
      ...scout,
      isConnected: false,
      isPending: false
    }));
    
    res.json(scoutsWithConnectionStatus);
  } catch (error) {
    console.error('Error fetching scouts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/network/coaches/:id/favorite
// @desc    Toggle favorite status for a coach
// @access  Private (Player)
router.post('/coaches/:id/favorite', [auth, requireRole('player')], async (req, res) => {
  try {
    const coachId = req.params.id;
    
    // Validate coach ID
    if (!mongoose.Types.ObjectId.isValid(coachId)) {
      return res.status(400).json({ message: 'Invalid coach ID' });
    }
    
    // Check if coach exists
    const coach = await User.findOne({ _id: coachId, role: 'coach' });
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    
    // Get current user
    const user = await User.findById(req.userId);
    
    // Initialize favoriteCoaches array if it doesn't exist
    if (!user.favoriteCoaches) {
      user.favoriteCoaches = [];
    }
    
    // Toggle favorite status
    const index = user.favoriteCoaches.indexOf(coachId);
    if (index === -1) {
      // Add to favorites
      user.favoriteCoaches.push(coachId);
      await user.save();
      return res.json({ isFavorite: true, message: 'Coach added to favorites' });
    } else {
      // Remove from favorites
      user.favoriteCoaches.splice(index, 1);
      await user.save();
      return res.json({ isFavorite: false, message: 'Coach removed from favorites' });
    }
  } catch (error) {
    console.error('Error toggling favorite coach:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/network/scouts/:id/connect
// @desc    Request connection with a scout
// @access  Private (Player)
router.post('/scouts/:id/connect', [auth, requireRole('player')], async (req, res) => {
  try {
    const scoutId = req.params.id;
    
    // Validate scout ID
    if (!mongoose.Types.ObjectId.isValid(scoutId)) {
      return res.status(400).json({ message: 'Invalid scout ID' });
    }
    
    // Check if scout exists
    const scout = await User.findOne({ _id: scoutId, role: 'scout' });
    if (!scout) {
      return res.status(404).json({ message: 'Scout not found' });
    }
    
    // Get current user
    const user = await User.findById(req.userId);
    
    // Initialize arrays if they don't exist
    if (!user.connectedScouts) user.connectedScouts = [];
    if (!user.pendingScoutRequests) user.pendingScoutRequests = [];
    
    // Check if already connected
    if (user.connectedScouts.includes(scoutId)) {
      return res.status(400).json({ message: 'Already connected with this scout' });
    }
    
    // Check if already pending
    if (user.pendingScoutRequests.includes(scoutId)) {
      return res.status(400).json({ message: 'Connection request already pending' });
    }
    
    // Add to pending requests
    user.pendingScoutRequests.push(scoutId);
    await user.save();
    
    // TODO: Notify scout about connection request (via socket.io or notification system)
    
    return res.json({ isPending: true, message: 'Connection request sent' });
  } catch (error) {
    console.error('Error requesting scout connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/network/districts
// @desc    Get unique districts for filtering
// @access  Public
router.get('/districts', async (req, res) => {
  try {
    // Find unique districts from users who are coaches or scouts
    const districts = await User.distinct('district', { 
      role: { $in: ['coach', 'scout'] },
      district: { $exists: true, $ne: '' }
    });
    
    res.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 