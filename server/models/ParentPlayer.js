const mongoose = require('mongoose');

const ParentPlayerSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Only required if the link is verified
      return this.isVerified === true;
    },
    index: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  relationship: {
    type: String,
    enum: ['father', 'mother', 'guardian', 'other', 'parent'],
    default: 'parent'
  },
  accessCode: {
    type: String,
    required: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
ParentPlayerSchema.index({ parent: 1, player: 1 }, { unique: true });

const ParentPlayer = mongoose.model('ParentPlayer', ParentPlayerSchema);

module.exports = { ParentPlayer }; 