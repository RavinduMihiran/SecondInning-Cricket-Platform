const mongoose = require('mongoose');

const PlayerStatSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  match: {
    opponent: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    venue: {
      type: String,
      trim: true
    },
    format: {
      type: String,
      enum: ['T20', 'ODI', 'Test', 'T10', 'Other'],
      default: 'T20'
    },
    result: {
      type: String,
      enum: ['Win', 'Loss', 'Draw', 'No Result'],
      default: null
    }
  },
  batting: {
    runs: {
      type: Number,
      default: 0,
      min: 0
    },
    balls: {
      type: Number,
      default: 0,
      min: 0
    },
    fours: {
      type: Number,
      default: 0,
      min: 0
    },
    sixes: {
      type: Number,
      default: 0,
      min: 0
    },
    strikeRate: {
      type: Number,
      default: 0,
      min: 0
    },
    dismissal: {
      type: String,
      enum: ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Not Out', 'Retired Hurt', 'Did Not Bat'],
      default: 'Not Out'
    },
    position: {
      type: Number,
      min: 1,
      max: 11
    }
  },
  bowling: {
    overs: {
      type: Number,
      default: 0,
      min: 0
    },
    maidens: {
      type: Number,
      default: 0,
      min: 0
    },
    runs: {
      type: Number,
      default: 0,
      min: 0
    },
    wickets: {
      type: Number,
      default: 0,
      min: 0
    },
    economy: {
      type: Number,
      default: 0,
      min: 0
    },
    dotBalls: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  fielding: {
    catches: {
      type: Number,
      default: 0,
      min: 0
    },
    runOuts: {
      type: Number,
      default: 0,
      min: 0
    },
    stumpings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  highlights: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  mediaLinks: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Compound index for efficient filtering and sorting
PlayerStatSchema.index({ "player": 1, "match.date": -1 });
PlayerStatSchema.index({ "batting.runs": -1, "player": 1 });
PlayerStatSchema.index({ "bowling.wickets": -1, "player": 1 });

// Virtual for strike rate calculation
PlayerStatSchema.virtual('strikeRateCalculated').get(function() {
  if (this.batting.balls === 0) return 0;
  return ((this.batting.runs / this.batting.balls) * 100).toFixed(2);
});

// Virtual for economy rate calculation
PlayerStatSchema.virtual('economyCalculated').get(function() {
  if (this.bowling.overs === 0) return 0;
  return (this.bowling.runs / this.bowling.overs).toFixed(2);
});

// Method to update player's stats summary in User model
PlayerStatSchema.methods.updatePlayerSummary = async function() {
  // Import User model here to avoid circular dependency
  const { User } = require('./User');
  
  try {
    // Get all stats for this player
    const allStats = await this.constructor.find({ player: this.player });
    
    // Calculate aggregated stats
    let totalMatches = allStats.length;
    let totalRuns = allStats.reduce((sum, stat) => sum + stat.batting.runs, 0);
    let totalWickets = allStats.reduce((sum, stat) => sum + stat.bowling.wickets, 0);
    
    // Calculate batting average
    let innings = allStats.filter(stat => 
      stat.batting.dismissal !== 'Did Not Bat'
    ).length;
    
    let outDismissals = allStats.filter(stat => 
      stat.batting.dismissal !== 'Not Out' && 
      stat.batting.dismissal !== 'Did Not Bat' && 
      stat.batting.dismissal !== 'Retired Hurt'
    ).length;
    
    let battingAvg = outDismissals > 0 ? (totalRuns / outDismissals).toFixed(2) : totalRuns;
    
    // Calculate bowling average
    let bowlingInnings = allStats.filter(stat => stat.bowling.overs > 0).length;
    let bowlingAvg = totalWickets > 0 ? 
      (allStats.reduce((sum, stat) => sum + stat.bowling.runs, 0) / totalWickets).toFixed(2) : 0;
    
    // Update user's stats summary
    await User.findByIdAndUpdate(this.player, {
      stats: {
        matches: totalMatches,
        runs: totalRuns,
        wickets: totalWickets,
        battingAvg: parseFloat(battingAvg),
        bowlingAvg: parseFloat(bowlingAvg)
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error updating player summary:', error);
    return false;
  }
};

// Post save middleware to update player summary
PlayerStatSchema.post('save', async function() {
  await this.updatePlayerSummary();
  
  // Check for achievements
  try {
    const { Achievement } = require('./Achievement');
    await Achievement.checkAchievements(this);
    await Achievement.checkCareerMilestones(this.player);
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
});

// Post remove middleware to update player summary
PlayerStatSchema.post('remove', async function() {
  await this.updatePlayerSummary();
});

const PlayerStat = mongoose.model('PlayerStat', PlayerStatSchema);

module.exports = { PlayerStat }; 