const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  activityType: {
    type: String,
    required: true,
    enum: ['user_joined', 'user_updated', 'user_deactivated', 'media_uploaded', 'media_approved', 'media_rejected', 'announcement_created', 'system_backup', 'admin_login', 'coach_login', 'player_login', 'scout_login', 'player_rated', 'player_added_to_watchlist']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ip: String,
    userAgent: String,
    browser: String,
    platform: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster querying by timestamp (for recent activities)
ActivityLogSchema.index({ timestamp: -1 });

// Index for faster querying by activityType
ActivityLogSchema.index({ activityType: 1 });

// Index for faster user-specific activity queries
ActivityLogSchema.index({ user: 1 });

// Create a static method to log activities easily
ActivityLogSchema.statics.logActivity = async function(activityData) {
  try {
    return await this.create({
      activityType: activityData.activityType,
      user: activityData.user || null,
      performedBy: activityData.performedBy || null,
      details: activityData.details || {},
      metadata: activityData.metadata || {}
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent disrupting the main operation
    return null;
  }
};

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

module.exports = { ActivityLog }; 