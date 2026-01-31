const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'trial', 'event', 'update'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  image: {
    type: String // URL to image
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries by type and active status
AnnouncementSchema.index({ type: 1, isActive: 1 });
AnnouncementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

module.exports = { Announcement }; 