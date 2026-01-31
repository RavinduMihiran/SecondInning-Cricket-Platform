const mongoose = require('mongoose');

// Define a virtual getter for contentModel to map contentType to model names
const getModelForContentType = (contentType) => {
  const contentTypeToModelMap = {
    'stat': 'PlayerStat',
    'achievement': 'Achievement',
    'feedback': 'CoachFeedback',
    'match': 'Match',
    'general': null
  };
  return contentTypeToModelMap[contentType] || null;
};

const ParentEngagementSchema = new mongoose.Schema({
  parent: {
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
  // The engagement can be linked to various types of content
  contentType: {
    type: String,
    enum: ['stat', 'achievement', 'feedback', 'match', 'general'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      // Only require contentId for specific content types
      return this.contentType !== 'general';
    }
  },
  // Type of engagement
  engagementType: {
    type: String,
    enum: ['reaction', 'comment', 'sticker'],
    required: true
  },
  // For reactions
  reactionType: {
    type: String,
    enum: ['love', 'proud', 'encouragement'],
    required: function() {
      return this.engagementType === 'reaction';
    }
  },
  // For stickers
  stickerType: {
    type: String,
    enum: ['well_played', 'keep_chin_up', 'great_job', 'star', 'trophy', 'thumbs_up'],
    required: function() {
      return this.engagementType === 'sticker';
    }
  },
  // For comments
  comment: {
    type: String,
    required: function() {
      return this.engagementType === 'comment';
    },
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  // Has the player seen this engagement?
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for content reference - will be populated manually in queries
ParentEngagementSchema.virtual('content');

// Indexes for efficient queries
ParentEngagementSchema.index({ player: 1, createdAt: -1 });
ParentEngagementSchema.index({ contentType: 1, contentId: 1 });
ParentEngagementSchema.index({ parent: 1, createdAt: -1 });
// Add non-unique compound index for parent, contentType, contentId
ParentEngagementSchema.index({ parent: 1, contentType: 1, contentId: 1 });

// Pre-save middleware to set default contentId for 'general' type if not provided
ParentEngagementSchema.pre('save', function(next) {
  if (this.contentType === 'general' && !this.contentId) {
    // Generate a unique ObjectId for each general engagement
    this.contentId = new mongoose.Types.ObjectId();
  }
  next();
});

const ParentEngagement = mongoose.model('ParentEngagement', ParentEngagementSchema);

module.exports = { ParentEngagement }; 