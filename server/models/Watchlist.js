const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
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
  notes: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  }
}, {
  timestamps: true
});

// Compound index for unique coach-player combinations
WatchlistSchema.index({ coach: 1, player: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', WatchlistSchema);

module.exports = { Watchlist }; 