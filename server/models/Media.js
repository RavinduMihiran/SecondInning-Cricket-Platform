const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  tags: [{
    type: String
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'coaches_scouts'],
    default: 'public'
  },
  isApproved: {
    type: Boolean,
    default: null
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  moderationDate: {
    type: Date,
    default: null
  },
  moderationReason: {
    type: String,
    default: ''
  },
  relatedTo: {
    matchStat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlayerStat',
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for quick searching and filtering
MediaSchema.index({ user: 1, createdAt: -1 });
MediaSchema.index({ fileType: 1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ isApproved: 1 });
MediaSchema.index({ notificationSent: 1 });

module.exports = mongoose.model('Media', MediaSchema); 