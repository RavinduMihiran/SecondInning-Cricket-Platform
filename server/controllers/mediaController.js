const mongoose = require('mongoose');
const Media = require('../models/Media');
const { ActivityLog } = require('../models/ActivityLog');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

// @route   GET api/media
// @desc    Get all media for current user
// @access  Private
exports.getUserMedia = async (req, res) => {
  try {
    // Check if we should include moderated items that might be deleted
    const includeModerated = req.query.includeModerated === 'true';
    
    // Base query
    const query = { user: req.userId };
    
    // If not including moderated items, only return items that aren't rejected
    if (!includeModerated) {
      query.isApproved = { $ne: false };
    }
    
    const media = await Media.find(query).sort({ createdAt: -1 });
    
    // Add file URLs to each media item for proper display
    const mediaWithUrls = media.map(item => {
      const itemObj = item.toObject();
      
      // Only add URL if the item is not rejected (file might be deleted)
      if (item.isApproved !== false) {
        itemObj.fileUrl = `/uploads/${item.filePath}`;
      }
      
      return itemObj;
    });
    
    res.json(mediaWithUrls);
  } catch (err) {
    console.error('Error fetching user media:', err);
    res.status(500).json({ message: 'Server error fetching media' });
  }
};

// @route   GET api/media/player/:playerId
// @desc    Get all public media for a specific player
// @access  Public
exports.getPlayerMedia = async (req, res) => {
  try {
    const media = await Media.find({ 
      user: req.params.playerId,
      visibility: 'public'
    }).sort({ createdAt: -1 });
    
    res.json(media);
  } catch (err) {
    console.error('Error fetching player media:', err);
    res.status(500).json({ message: 'Server error fetching player media' });
  }
};

// @route   GET api/media/:id
// @desc    Get a specific media item
// @access  Private
exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    // Check if user has permission to view this media
    if (media.user.toString() !== req.userId && 
        media.visibility !== 'public' &&
        (media.visibility !== 'coaches_scouts' || 
         (req.userRole !== 'coach' && req.userRole !== 'scout'))) {
      return res.status(403).json({ message: 'Not authorized to view this media' });
    }
    
    res.json(media);
  } catch (err) {
    console.error('Error fetching media by ID:', err);
    res.status(500).json({ message: 'Server error fetching media' });
  }
};

// @route   POST api/media
// @desc    Upload new media
// @access  Private
exports.uploadMedia = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { title, description, fileType, visibility, tags, relatedMatchId } = req.body;
    
    // Get just the filename from the full path
    const filename = req.file.filename || path.basename(req.file.path);
    
    // Create new media entry
    const newMedia = new Media({
      user: req.userId,
      title: title || req.file.originalname,
      description: description || '',
      fileType: fileType || determineFileType(req.file.mimetype),
      filePath: filename, // Just store the filename
      fileSize: req.file.size,
      thumbnail: filename, // For now, use the same filename (we could generate thumbnails later)
      tags: tags ? JSON.parse(tags) : [],
      visibility: visibility || 'public',
      isApproved: null, // Set initial approval status as pending
      relatedTo: {
        matchStat: relatedMatchId || null
      }
    });
    
    await newMedia.save();
    
    // Log media upload activity
    await ActivityLog.logActivity({
      activityType: 'media_uploaded',
      user: req.userId,
      details: { 
        mediaId: newMedia._id,
        title: newMedia.title,
        fileType: newMedia.fileType,
        visibility: newMedia.visibility,
        fileSize: newMedia.fileSize
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    // Add the server URL to the response for immediate display
    const mediaWithUrl = newMedia.toObject();
    mediaWithUrl.fileUrl = `/uploads/${filename}`;
    
    res.status(201).json(mediaWithUrl);
  } catch (err) {
    console.error('Error uploading media:', err);
    res.status(500).json({ message: 'Server error uploading media' });
  }
};

// @route   DELETE api/media/:id
// @desc    Delete media
// @access  Private
exports.deleteMedia = async (req, res) => {
  try {
    console.log('Delete media request:', {
      mediaId: req.params.id,
      requestUserId: req.userId,
      userRole: req.userRole
    });
    
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    console.log('Media found:', {
      mediaId: media._id,
      mediaUserId: media.user.toString(),
      requestUserId: req.userId,
      userRole: req.userRole,
      isOwner: media.user.toString() === req.userId,
      isAdmin: req.userRole === 'admin'
    });
    
    // Fix: Convert ObjectId to string for comparison and ensure req.userId is valid
    const mediaUserId = media.user.toString();
    const requestUserId = req.userId ? req.userId.toString() : '';
    
    // Check if user owns this media or is an admin
    if (mediaUserId !== requestUserId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this media' });
    }
    
    // Delete the file from storage
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      // Use just the filename, not the full path
      const filePath = path.join(uploadsDir, media.filePath);
      
      console.log(`Attempting to delete file: ${filePath}`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Successfully deleted file: ${filePath}`);
      } else {
        console.log(`File not found at path: ${filePath}`);
      }
      
      // Delete thumbnail if it exists and is different from main file
      if (media.thumbnail && media.thumbnail !== media.filePath) {
        const thumbnailPath = path.join(uploadsDir, media.thumbnail);
        console.log(`Attempting to delete thumbnail: ${thumbnailPath}`);
        
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
          console.log(`Successfully deleted thumbnail: ${thumbnailPath}`);
        } else {
          console.log(`Thumbnail not found at path: ${thumbnailPath}`);
        }
      }
    } catch (err) {
      console.error('Error deleting file from storage:', err);
      // Continue with deletion from database even if file deletion fails
    }
    
    await Media.deleteOne({ _id: media._id });
    
    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    console.error('Error deleting media:', err);
    res.status(500).json({ message: 'Server error deleting media' });
  }
};

// @route   PUT api/media/:id
// @desc    Update media details
// @access  Private
exports.updateMedia = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    console.log('Update media request:', {
      mediaId: req.params.id,
      requestUserId: req.userId,
      userRole: req.userRole
    });
    
    const { title, description, visibility, tags } = req.body;
    
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    console.log('Media found:', {
      mediaId: media._id,
      mediaUserId: media.user.toString(),
      requestUserId: req.userId,
      userRole: req.userRole,
      isOwner: media.user.toString() === req.userId,
      isAdmin: req.userRole === 'admin'
    });
    
    // Fix: Convert ObjectId to string for comparison and ensure req.userId is valid
    const mediaUserId = media.user.toString();
    const requestUserId = req.userId ? req.userId.toString() : '';
    
    // Check if user owns this media or is an admin
    if (mediaUserId !== requestUserId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this media' });
    }
    
    // Update fields
    if (title) media.title = title;
    if (description !== undefined) media.description = description;
    if (visibility) media.visibility = visibility;
    if (tags) media.tags = JSON.parse(tags);
    
    await media.save();
    
    res.json(media);
  } catch (err) {
    console.error('Error updating media:', err);
    res.status(500).json({ message: 'Server error updating media' });
  }
};

// Helper function to determine file type from MIME type
function determineFileType(mimeType) {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('application/pdf') || 
             mimeType.startsWith('application/msword') || 
             mimeType.includes('document') || 
             mimeType.includes('spreadsheet')) {
    return 'document';
  } else {
    return 'document'; // Default to document for unknown types
  }
} 