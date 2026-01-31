const mongoose = require('mongoose');

const CoachFeedbackSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  feedback: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['batting', 'bowling', 'fielding', 'fitness', 'general'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
CoachFeedbackSchema.index({ player: 1, createdAt: -1 });
CoachFeedbackSchema.index({ coach: 1, createdAt: -1 });

const CoachFeedback = mongoose.model('CoachFeedback', CoachFeedbackSchema);

module.exports = { CoachFeedback }; 