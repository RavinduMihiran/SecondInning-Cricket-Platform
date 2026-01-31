const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Batting', 'Bowling', 'Fielding', 'All-Round', 'Team', 'Career', 'Special'],
    required: true
  },
  achievementDate: {
    type: Date,
    required: true,
    index: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlayerStat',
    default: null
  },
  opponent: {
    type: String,
    trim: true
  },
  venue: {
    type: String,
    trim: true
  },
  value: {
    type: Number, // For numeric achievements like centuries, five-wicket hauls
    default: null
  },
  badgeImage: {
    type: String, // URL to badge image
    default: null
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    default: 'Bronze'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  submissionNotes: {
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

// Create indexes for better performance
AchievementSchema.index({ "player": 1, "achievementDate": -1 });
AchievementSchema.index({ "category": 1, "player": 1 });
AchievementSchema.index({ "tier": 1, "category": 1 });

// Define standard achievements as statics on the model
AchievementSchema.statics.ACHIEVEMENT_TYPES = {
  BATTING: {
    FIFTY: { title: "Half Century", category: "Batting", tier: "Bronze" },
    CENTURY: { title: "Century", category: "Batting", tier: "Silver" },
    DOUBLE_CENTURY: { title: "Double Century", category: "Batting", tier: "Gold" },
    HIGH_STRIKE_RATE: { title: "Lightning Bat", category: "Batting", tier: "Bronze" },
    SIXES_KING: { title: "Sixes King", category: "Batting", tier: "Silver" },
  },
  BOWLING: {
    THREE_WICKETS: { title: "Three Wicket Haul", category: "Bowling", tier: "Bronze" },
    FIVE_WICKETS: { title: "Five Wicket Haul", category: "Bowling", tier: "Silver" },
    TEN_WICKETS: { title: "Ten Wicket Match", category: "Bowling", tier: "Gold" },
    ECONOMY_MASTER: { title: "Economy Master", category: "Bowling", tier: "Bronze" },
    MAIDEN_OVER: { title: "Maiden Over", category: "Bowling", tier: "Bronze" },
  },
  FIELDING: {
    THREE_CATCHES: { title: "Safe Hands", category: "Fielding", tier: "Bronze" },
    FIVE_CATCHES: { title: "Catching Brilliance", category: "Fielding", tier: "Silver" },
    DIRECT_HIT: { title: "Sharp Shooter", category: "Fielding", tier: "Bronze" },
  },
  ALL_ROUND: {
    FIFTY_AND_THREE_WICKETS: { title: "Impact Player", category: "All-Round", tier: "Silver" },
    CENTURY_AND_FIVE_WICKETS: { title: "Match Dominator", category: "All-Round", tier: "Gold" },
  },
  CAREER: {
    THOUSAND_RUNS: { title: "1000 Run Milestone", category: "Career", tier: "Silver" },
    FIFTY_WICKETS: { title: "50 Wicket Milestone", category: "Career", tier: "Silver" },
    TEN_MATCHES: { title: "Consistent Performer", category: "Career", tier: "Bronze" },
  }
};

// Check for achievements after a match
AchievementSchema.statics.checkAchievements = async function(playerStat) {
  const Achievement = this;
  const achievements = [];
  
  // Check batting achievements
  if (playerStat.batting.runs >= 100) {
    achievements.push({
      player: playerStat.player,
      title: Achievement.ACHIEVEMENT_TYPES.BATTING.CENTURY.title,
      description: `Scored a century (${playerStat.batting.runs} runs) against ${playerStat.match.opponent}`,
      category: Achievement.ACHIEVEMENT_TYPES.BATTING.CENTURY.category,
      tier: Achievement.ACHIEVEMENT_TYPES.BATTING.CENTURY.tier,
      achievementDate: playerStat.match.date,
      match: playerStat._id,
      opponent: playerStat.match.opponent,
      venue: playerStat.match.venue,
      value: playerStat.batting.runs
    });
  } else if (playerStat.batting.runs >= 50) {
    achievements.push({
      player: playerStat.player,
      title: Achievement.ACHIEVEMENT_TYPES.BATTING.FIFTY.title,
      description: `Scored a half-century (${playerStat.batting.runs} runs) against ${playerStat.match.opponent}`,
      category: Achievement.ACHIEVEMENT_TYPES.BATTING.FIFTY.category,
      tier: Achievement.ACHIEVEMENT_TYPES.BATTING.FIFTY.tier,
      achievementDate: playerStat.match.date,
      match: playerStat._id,
      opponent: playerStat.match.opponent,
      venue: playerStat.match.venue,
      value: playerStat.batting.runs
    });
  }
  
  // Check bowling achievements
  if (playerStat.bowling.wickets >= 5) {
    achievements.push({
      player: playerStat.player,
      title: Achievement.ACHIEVEMENT_TYPES.BOWLING.FIVE_WICKETS.title,
      description: `Took ${playerStat.bowling.wickets} wickets against ${playerStat.match.opponent}`,
      category: Achievement.ACHIEVEMENT_TYPES.BOWLING.FIVE_WICKETS.category,
      tier: Achievement.ACHIEVEMENT_TYPES.BOWLING.FIVE_WICKETS.tier,
      achievementDate: playerStat.match.date,
      match: playerStat._id,
      opponent: playerStat.match.opponent,
      venue: playerStat.match.venue,
      value: playerStat.bowling.wickets
    });
  } else if (playerStat.bowling.wickets >= 3) {
    achievements.push({
      player: playerStat.player,
      title: Achievement.ACHIEVEMENT_TYPES.BOWLING.THREE_WICKETS.title,
      description: `Took ${playerStat.bowling.wickets} wickets against ${playerStat.match.opponent}`,
      category: Achievement.ACHIEVEMENT_TYPES.BOWLING.THREE_WICKETS.category,
      tier: Achievement.ACHIEVEMENT_TYPES.BOWLING.THREE_WICKETS.tier,
      achievementDate: playerStat.match.date,
      match: playerStat._id,
      opponent: playerStat.match.opponent,
      venue: playerStat.match.venue,
      value: playerStat.bowling.wickets
    });
  }
  
  // Check all-round achievements
  if (playerStat.batting.runs >= 50 && playerStat.bowling.wickets >= 3) {
    achievements.push({
      player: playerStat.player,
      title: Achievement.ACHIEVEMENT_TYPES.ALL_ROUND.FIFTY_AND_THREE_WICKETS.title,
      description: `All-round performance with ${playerStat.batting.runs} runs and ${playerStat.bowling.wickets} wickets against ${playerStat.match.opponent}`,
      category: Achievement.ACHIEVEMENT_TYPES.ALL_ROUND.FIFTY_AND_THREE_WICKETS.category,
      tier: Achievement.ACHIEVEMENT_TYPES.ALL_ROUND.FIFTY_AND_THREE_WICKETS.tier,
      achievementDate: playerStat.match.date,
      match: playerStat._id,
      opponent: playerStat.match.opponent,
      venue: playerStat.match.venue
    });
  }
  
  // Check fielding achievements
  if (playerStat.fielding.catches >= 3) {
    achievements.push({
      player: playerStat.player,
      title: Achievement.ACHIEVEMENT_TYPES.FIELDING.THREE_CATCHES.title,
      description: `Took ${playerStat.fielding.catches} catches against ${playerStat.match.opponent}`,
      category: Achievement.ACHIEVEMENT_TYPES.FIELDING.THREE_CATCHES.category,
      tier: Achievement.ACHIEVEMENT_TYPES.FIELDING.THREE_CATCHES.tier,
      achievementDate: playerStat.match.date,
      match: playerStat._id,
      opponent: playerStat.match.opponent,
      venue: playerStat.match.venue,
      value: playerStat.fielding.catches
    });
  }
  
  // Insert all achievements
  if (achievements.length > 0) {
    await Achievement.insertMany(achievements);
  }
  
  return achievements;
};

// Check career milestones
AchievementSchema.statics.checkCareerMilestones = async function(playerId) {
  const { PlayerStat } = require('./PlayerStat');
  const { User } = require('./User');
  const Achievement = this;
  
  try {
    // Get player stats
    const player = await User.findById(playerId);
    
    if (!player) {
      return [];
    }
    
    const achievements = [];
    
    // Check for matches milestone
    if (player.stats.matches >= 10) {
      const existingAchievement = await Achievement.findOne({
        player: playerId,
        title: Achievement.ACHIEVEMENT_TYPES.CAREER.TEN_MATCHES.title
      });
      
      if (!existingAchievement) {
        achievements.push({
          player: playerId,
          title: Achievement.ACHIEVEMENT_TYPES.CAREER.TEN_MATCHES.title,
          description: `Completed ${player.stats.matches} matches - a dedicated performer!`,
          category: Achievement.ACHIEVEMENT_TYPES.CAREER.TEN_MATCHES.category,
          tier: Achievement.ACHIEVEMENT_TYPES.CAREER.TEN_MATCHES.tier,
          achievementDate: new Date(),
          value: player.stats.matches
        });
      }
    }
    
    // Check for 1000 runs milestone
    if (player.stats.runs >= 1000) {
      const existingAchievement = await Achievement.findOne({
        player: playerId,
        title: Achievement.ACHIEVEMENT_TYPES.CAREER.THOUSAND_RUNS.title
      });
      
      if (!existingAchievement) {
        achievements.push({
          player: playerId,
          title: Achievement.ACHIEVEMENT_TYPES.CAREER.THOUSAND_RUNS.title,
          description: `Scored ${player.stats.runs} runs in career - a batting milestone!`,
          category: Achievement.ACHIEVEMENT_TYPES.CAREER.THOUSAND_RUNS.category,
          tier: Achievement.ACHIEVEMENT_TYPES.CAREER.THOUSAND_RUNS.tier,
          achievementDate: new Date(),
          value: player.stats.runs
        });
      }
    }
    
    // Check for 50 wickets milestone
    if (player.stats.wickets >= 50) {
      const existingAchievement = await Achievement.findOne({
        player: playerId,
        title: Achievement.ACHIEVEMENT_TYPES.CAREER.FIFTY_WICKETS.title
      });
      
      if (!existingAchievement) {
        achievements.push({
          player: playerId,
          title: Achievement.ACHIEVEMENT_TYPES.CAREER.FIFTY_WICKETS.title,
          description: `Took ${player.stats.wickets} wickets in career - a bowling milestone!`,
          category: Achievement.ACHIEVEMENT_TYPES.CAREER.FIFTY_WICKETS.category,
          tier: Achievement.ACHIEVEMENT_TYPES.CAREER.FIFTY_WICKETS.tier,
          achievementDate: new Date(),
          value: player.stats.wickets
        });
      }
    }
    
    // Insert career achievements
    if (achievements.length > 0) {
      await Achievement.insertMany(achievements);
    }
    
    return achievements;
  } catch (error) {
    console.error('Error checking career milestones:', error);
    return [];
  }
};

const Achievement = mongoose.model('Achievement', AchievementSchema);

module.exports = { Achievement }; 