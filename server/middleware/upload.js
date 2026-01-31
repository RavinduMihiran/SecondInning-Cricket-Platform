const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists with absolute path
const uploadsDir = path.join(__dirname, '../uploads');
console.log('Uploads directory path:', uploadsDir);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  try {
    console.log('Creating uploads directory');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created successfully');
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    // Continue execution, as the error will be caught later if directory is inaccessible
  }
}

// Configure storage with proper file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double-check directory exists before trying to write
    if (!fs.existsSync(uploadsDir)) {
      return cb(new Error('Uploads directory does not exist or is not accessible'), null);
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Get the correct file extension
    let ext = path.extname(file.originalname);
    if (!ext) {
      // If no extension, infer from mimetype
      if (file.mimetype === 'image/jpeg') ext = '.jpg';
      else if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else ext = '.jpg'; // Default
    }
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit (increased from 2MB)
  },
  fileFilter: fileFilter
});

// Error handler middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ message: err.message });
  }
  next();
};

module.exports = { upload, handleMulterError }; 