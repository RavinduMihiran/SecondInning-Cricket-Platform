const mongoose = require('mongoose');

const PlayerRatingSchema = new mongoose.Schema({
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
  overall: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  batting: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  bowling: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  fielding: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  fitness: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index for unique coach-player combinations
PlayerRatingSchema.index({ coach: 1, player: 1 }, { unique: true });

const PlayerRating = mongoose.model('PlayerRating', PlayerRatingSchema);

module.exports = { PlayerRating }; 