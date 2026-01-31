const { PlayerStat } = require('../models/PlayerStat');
const { User } = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Announcement } = require('../models/Announcement');

// @route   GET api/stats/player/:playerId
// @desc    Get all stats for a player
// @access  Public
exports.getPlayerStats = async (req, res) => {
  try {
    const stats = await PlayerStat.find({ player: req.params.playerId })
      .sort({ 'match.date': -1 });
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching player stats:', err);
    res.status(500).json({ message: 'Server error fetching player stats' });
  }
};

// @route   GET api/stats/summary
// @desc    Get stats summary for the current user
// @access  Private
exports.getStatsSummary = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all stats for this player
    const allStats = await PlayerStat.find({ player: userId });
    
    if (allStats.length === 0) {
      return res.json({
        totalMatches: 0,
        recentMatches: 0,
        battingAverage: 0,
        battingAvgChange: 0,
        totalRuns: 0,
        seasonRuns: 0,
        totalWickets: 0,
        seasonWickets: 0,
        totalFielding: 0,
        seasonFielding: 0
      });
    }
    
    // Calculate total stats
    const totalMatches = allStats.length;
    const totalRuns = allStats.reduce((sum, stat) => sum + stat.batting.runs, 0);
    const totalWickets = allStats.reduce((sum, stat) => sum + stat.bowling.wickets, 0);
    
    // Calculate total fielding contributions (catches + runOuts + stumpings)
    const totalFielding = allStats.reduce((sum, stat) => {
      return sum + 
        (stat.fielding?.catches || 0) + 
        (stat.fielding?.runOuts || 0) + 
        (stat.fielding?.stumpings || 0);
    }, 0);
    
    // Get current season stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const seasonStats = allStats.filter(stat => new Date(stat.match.date) >= sixMonthsAgo);
    const seasonRuns = seasonStats.reduce((sum, stat) => sum + stat.batting.runs, 0);
    const seasonWickets = seasonStats.reduce((sum, stat) => sum + stat.bowling.wickets, 0);
    
    // Calculate season fielding contributions
    const seasonFielding = seasonStats.reduce((sum, stat) => {
      return sum + 
        (stat.fielding?.catches || 0) + 
        (stat.fielding?.runOuts || 0) + 
        (stat.fielding?.stumpings || 0);
    }, 0);
    
    // Calculate recent matches (this month)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const recentMatches = allStats.filter(stat => new Date(stat.match.date) >= thisMonth).length;
    
    // Calculate batting average
    const outDismissals = allStats.filter(stat => 
      stat.batting.dismissal !== 'Not Out' && 
      stat.batting.dismissal !== 'Did Not Bat' && 
      stat.batting.dismissal !== 'Retired Hurt'
    ).length;
    
    const battingAverage = outDismissals > 0 ? totalRuns / outDismissals : totalRuns;
    
    // Calculate batting average change (from previous 6 months)
    const previousSixMonths = new Date(sixMonthsAgo);
    previousSixMonths.setMonth(previousSixMonths.getMonth() - 6);
    
    const previousStats = allStats.filter(stat => 
      new Date(stat.match.date) >= previousSixMonths && 
      new Date(stat.match.date) < sixMonthsAgo
    );
    
    const previousOutDismissals = previousStats.filter(stat => 
      stat.batting.dismissal !== 'Not Out' && 
      stat.batting.dismissal !== 'Did Not Bat' && 
      stat.batting.dismissal !== 'Retired Hurt'
    ).length;
    
    const previousRuns = previousStats.reduce((sum, stat) => sum + stat.batting.runs, 0);
    const previousAvg = previousOutDismissals > 0 ? previousRuns / previousOutDismissals : previousRuns;
    
    const battingAvgChange = battingAverage - previousAvg;
    
    res.json({
      totalMatches,
      recentMatches,
      battingAverage,
      battingAvgChange,
      totalRuns,
      seasonRuns,
      totalWickets,
      seasonWickets,
      totalFielding,
      seasonFielding
    });
  } catch (err) {
    console.error('Error fetching stats summary:', err);
    res.status(500).json({ message: 'Server error fetching stats summary' });
  }
};

// @route   GET api/stats/recent
// @desc    Get recent matches for the current user
// @access  Private
exports.getRecentMatches = async (req, res) => {
  try {
    // Get limit from query params, default to 5
    const limit = parseInt(req.query.limit) || 5;
    
    // Get recent matches
    const recentMatches = await PlayerStat.find({ player: req.userId })
      .sort({ 'match.date': -1 })
      .limit(limit);
    
    // Format response
    const matches = recentMatches.map(match => ({
      id: match._id,
      opponent: match.match.opponent,
      date: match.match.date,
      venue: match.match.venue,
      format: match.match.format,
      result: match.match.result,
      stats: {
        runs: match.batting.runs,
        balls: match.batting.balls,
        fours: match.batting.fours,
        sixes: match.batting.sixes,
        strikeRate: match.batting.strikeRate,
        dismissal: match.batting.dismissal,
        overs: match.bowling.overs,
        maidens: match.bowling.maidens,
        wickets: match.bowling.wickets,
        economy: match.bowling.economy,
        catches: match.fielding?.catches || 0,
        runOuts: match.fielding?.runOuts || 0,
        stumpings: match.fielding?.stumpings || 0
      }
    }));
    
    res.json(matches);
  } catch (err) {
    console.error('Error fetching recent matches:', err);
    res.status(500).json({ message: 'Server error fetching recent matches' });
  }
};

// @route   GET api/stats/performance
// @desc    Get performance trend data for the current user
// @access  Private
exports.getPerformanceTrend = async (req, res) => {
  try {
    // Get stats from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const stats = await PlayerStat.find({
      player: req.userId,
      'match.date': { $gte: sixMonthsAgo }
    }).sort({ 'match.date': 1 });
    
    // Group by month
    const performanceByMonth = {};
    
    stats.forEach(stat => {
      const date = new Date(stat.match.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!performanceByMonth[monthYear]) {
        performanceByMonth[monthYear] = {
          name: monthYear,
          runs: 0,
          wickets: 0,
          fielding: 0 // Combined fielding stats
        };
      }
      
      performanceByMonth[monthYear].runs += stat.batting.runs || 0;
      performanceByMonth[monthYear].wickets += stat.bowling.wickets || 0;
      
      // Add fielding stats (catches + runOuts + stumpings)
      const fieldingContributions = 
        (stat.fielding?.catches || 0) + 
        (stat.fielding?.runOuts || 0) + 
        (stat.fielding?.stumpings || 0);
      
      performanceByMonth[monthYear].fielding += fieldingContributions;
    });
    
    // Convert to array for chart data
    const performanceData = Object.values(performanceByMonth);
    
    // Ensure we have at least one data point if there's no data
    if (performanceData.length === 0) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getFullYear()}`;
      performanceData.push({
        name: currentMonth,
        runs: 0,
        wickets: 0,
        fielding: 0
      });
    }
    
    res.json(performanceData);
  } catch (err) {
    console.error('Error fetching performance trend:', err);
    res.status(500).json({ message: 'Server error fetching performance trend' });
  }
};

// @route   GET api/stats/detailed
// @desc    Get detailed cricket stats for the current user
// @access  Private
exports.getDetailedStats = async (req, res) => {
  try {
    // Get all stats for the current user
    const allStats = await PlayerStat.find({ player: req.userId })
      .sort({ 'match.date': -1 });
    
    if (!allStats || allStats.length === 0) {
      // Return empty stats if no data found
      return res.json({
        battingStats: {
          totalRuns: 0,
          highestScore: 0,
          battingAverage: 0,
          strikeRate: 0,
          fifties: 0,
          hundreds: 0,
          totalFours: 0,
          totalSixes: 0
        },
        bowlingStats: {
          totalWickets: 0,
          bestFigures: '0/0',
          bowlingAverage: 0,
          economy: 0,
          totalOvers: 0,
          totalMaidens: 0
        },
        fieldingStats: {
          totalCatches: 0,
          totalRunOuts: 0,
          totalStumpings: 0,
          totalContributions: 0,
          bestFieldingInMatch: 0,
          avgFieldingPerMatch: 0
        },
        totalMatches: 0
      });
    }
    
    // Calculate batting stats
    const battingStats = {
      totalRuns: allStats.reduce((sum, stat) => sum + stat.batting.runs, 0),
      highestScore: Math.max(...allStats.map(stat => stat.batting.runs)),
      totalBalls: allStats.reduce((sum, stat) => sum + stat.batting.balls, 0),
      totalFours: allStats.reduce((sum, stat) => sum + stat.batting.fours, 0),
      totalSixes: allStats.reduce((sum, stat) => sum + stat.batting.sixes, 0),
      fifties: allStats.filter(stat => stat.batting.runs >= 50 && stat.batting.runs < 100).length,
      hundreds: allStats.filter(stat => stat.batting.runs >= 100).length
    };
    
    // Calculate batting average
    const outDismissals = allStats.filter(stat => 
      stat.batting.dismissal !== 'Not Out' && 
      stat.batting.dismissal !== 'Did Not Bat' && 
      stat.batting.dismissal !== 'Retired Hurt'
    ).length;
    
    battingStats.battingAverage = outDismissals > 0 ? 
      battingStats.totalRuns / outDismissals : 
      battingStats.totalRuns;
    
    // Calculate strike rate
    battingStats.strikeRate = battingStats.totalBalls > 0 ? 
      (battingStats.totalRuns / battingStats.totalBalls) * 100 : 0;
    
    // Calculate bowling stats
    const bowlingStats = {
      totalWickets: allStats.reduce((sum, stat) => sum + stat.bowling.wickets, 0),
      totalOvers: allStats.reduce((sum, stat) => sum + stat.bowling.overs, 0),
      totalMaidens: allStats.reduce((sum, stat) => sum + stat.bowling.maidens, 0),
      totalRuns: allStats.reduce((sum, stat) => sum + stat.bowling.runs, 0),
      totalDotBalls: allStats.reduce((sum, stat) => sum + (stat.bowling.dotBalls || 0), 0)
    };
    
    // Calculate bowling average
    bowlingStats.bowlingAverage = bowlingStats.totalWickets > 0 ? 
      bowlingStats.totalRuns / bowlingStats.totalWickets : 0;
    
    // Calculate economy rate
    bowlingStats.economy = bowlingStats.totalOvers > 0 ? 
      bowlingStats.totalRuns / bowlingStats.totalOvers : 0;
    
    // Find best bowling figures
    let bestWickets = 0;
    let bestRuns = Infinity;
    
    allStats.forEach(stat => {
      if (stat.bowling.wickets > bestWickets || 
         (stat.bowling.wickets === bestWickets && stat.bowling.runs < bestRuns)) {
        bestWickets = stat.bowling.wickets;
        bestRuns = stat.bowling.runs;
      }
    });
    
    bowlingStats.bestFigures = bestWickets > 0 ? `${bestWickets}/${bestRuns}` : '0/0';
    
    // Calculate fielding stats - ensure we handle null/undefined values
    const fieldingStats = {
      totalCatches: allStats.reduce((sum, stat) => sum + (stat.fielding?.catches || 0), 0),
      totalRunOuts: allStats.reduce((sum, stat) => sum + (stat.fielding?.runOuts || 0), 0),
      totalStumpings: allStats.reduce((sum, stat) => sum + (stat.fielding?.stumpings || 0), 0)
    };
    
    // Calculate total fielding contributions
    fieldingStats.totalContributions = 
      fieldingStats.totalCatches + 
      fieldingStats.totalRunOuts + 
      fieldingStats.totalStumpings;
    
    // Calculate best fielding performance in a match
    fieldingStats.bestFieldingInMatch = Math.max(...allStats.map(stat => 
      (stat.fielding?.catches || 0) + 
      (stat.fielding?.runOuts || 0) + 
      (stat.fielding?.stumpings || 0)
    ));
    
    // Calculate average fielding contributions per match
    fieldingStats.avgFieldingPerMatch = allStats.length > 0 ? 
      fieldingStats.totalContributions / allStats.length : 0;
    
    res.json({
      battingStats,
      bowlingStats,
      fieldingStats,
      totalMatches: allStats.length
    });
  } catch (err) {
    console.error('Error fetching detailed stats:', err);
    res.status(500).json({ message: 'Server error fetching detailed stats' });
  }
};

// @route   POST api/stats
// @desc    Add new stats entry
// @access  Private
exports.addStats = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      opponent,
      date,
      venue,
      format,
      result,
      batting,
      bowling,
      fielding,
      highlights,
      mediaLinks
    } = req.body;
    
    // Create new stats entry
    const newStat = new PlayerStat({
      player: req.userId,
      match: {
        opponent,
        date: date || new Date(),
        venue,
        format: format || 'T20',
        result: result || 'No Result'
      },
      batting: {
        runs: batting?.runs || 0,
        balls: batting?.balls || 0,
        fours: batting?.fours || 0,
        sixes: batting?.sixes || 0,
        dismissal: batting?.dismissal || 'Not Out',
        position: batting?.position || 1,
        // Calculate strike rate if not provided
        strikeRate: batting?.strikeRate || (batting?.balls > 0 ? (batting.runs / batting.balls) * 100 : 0)
      },
      bowling: {
        overs: bowling?.overs || 0,
        maidens: bowling?.maidens || 0,
        runs: bowling?.runs || 0,
        wickets: bowling?.wickets || 0,
        dotBalls: bowling?.dotBalls || 0,
        // Calculate economy if not provided
        economy: bowling?.economy || (bowling?.overs > 0 ? bowling.runs / bowling.overs : 0)
      },
      fielding: fielding || {
        catches: 0,
        runOuts: 0,
        stumpings: 0
      },
      highlights: highlights || '',
      mediaLinks: mediaLinks || []
    });
    
    await newStat.save();
    
    // Get updated stats after saving
    const updatedStats = await exports.getDetailedStats({userId: req.userId}, {json: function(data) { return data; }});
    
    res.status(201).json({
      message: 'Stats added successfully',
      newStat,
      updatedStats
    });
  } catch (err) {
    console.error('Error adding stats:', err);
    res.status(500).json({ message: 'Server error adding stats' });
  }
};

// @route   GET api/stats/announcements
// @desc    Get announcements for players
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    // Fetch active announcements from the database, sorted by createdAt (newest first)
    const announcements = await Announcement.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .limit(10); // Limit to 10 most recent announcements
    
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
}; 