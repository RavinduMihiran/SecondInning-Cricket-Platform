const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mediaController = require('../controllers/mediaController');

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Use userId from the authenticated user
    const userId = req.userId || 'anonymous';
    cb(null, `${userId}-${uniqueSuffix}${ext}`);
  }
});

// Set up file filter
const fileFilter = (req, file, cb) => {
  // Accept images, videos and documents
  if (
    file.mimetype.startsWith('image/') || 
    file.mimetype.startsWith('video/') || 
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('document') ||
    file.mimetype.includes('spreadsheet')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

// Initialize multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// @route   GET api/media
// @desc    Get all media for current user
// @access  Private
router.get('/', auth, mediaController.getUserMedia);

// @route   GET api/media/player/:playerId
// @desc    Get all public media for a specific player
// @access  Public
router.get('/player/:playerId', mediaController.getPlayerMedia);

// @route   GET api/media/:id
// @desc    Get a specific media item
// @access  Private
router.get('/:id', auth, mediaController.getMediaById);

// @route   POST api/media
// @desc    Upload media
// @access  Private
router.post('/', 
  auth, 
  upload.single('mediaFile'),
  [
    check('title').optional().trim().not().isEmpty().withMessage('Title cannot be empty if provided'),
    check('visibility').optional().isIn(['public', 'private', 'coaches_scouts']).withMessage('Invalid visibility option')
  ],
  mediaController.uploadMedia
);

// @route   DELETE api/media/:id
// @desc    Delete media
// @access  Private
router.delete('/:id', auth, mediaController.deleteMedia);

// @route   PUT api/media/:id
// @desc    Update media details
// @access  Private
router.put('/:id',
  auth,
  [
    check('title').optional().trim().not().isEmpty().withMessage('Title cannot be empty if provided'),
    check('visibility').optional().isIn(['public', 'private', 'coaches_scouts']).withMessage('Invalid visibility option')
  ],
  mediaController.updateMedia
);

module.exports = router; 