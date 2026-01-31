import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaSpinner, FaPlusCircle, FaHandsHelping } from 'react-icons/fa';
import { getDetailedStats, getRecentMatches, getPerformanceTrend } from '../../services/statsService';
import { toast } from 'react-toastify';
import StatsRecordModal from '../../components/StatsRecordModal';

const Statistics = () => {
  const [detailedStats, setDetailedStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel
      const [statsData, matchesData, trendData] = await Promise.all([
        getDetailedStats(),
        getRecentMatches(5), // Get 5 recent matches
        getPerformanceTrend()
      ]);
      
      setDetailedStats(statsData);
      setRecentMatches(matchesData);
      setPerformanceTrend(trendData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatsAdded = (updatedStats) => {
    setDetailedStats(updatedStats);
    // Refresh all data
    fetchStatistics();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading statistics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cricket Statistics</h1>
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setIsStatsModalOpen(true)}
        >
          <FaPlusCircle /> Record New Stats
        </button>
      </div>
      
      {/* Stats Record Modal */}
      <StatsRecordModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onStatsAdded={handleStatsAdded}
      />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="card bg-white p-4">
          <h3 className="text-gray-500 font-medium text-sm">Total Matches</h3>
          <p className="text-3xl font-bold">{detailedStats?.totalMatches || 0}</p>
        </div>
        <div className="card bg-white p-4">
          <h3 className="text-gray-500 font-medium text-sm">Batting Average</h3>
          <p className="text-3xl font-bold">{detailedStats?.battingStats?.battingAverage?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="card bg-white p-4">
          <h3 className="text-gray-500 font-medium text-sm">Bowling Average</h3>
          <p className="text-3xl font-bold">{detailedStats?.bowlingStats?.bowlingAverage?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="card bg-white p-4">
          <h3 className="text-gray-500 font-medium text-sm">Highest Score</h3>
          <p className="text-3xl font-bold">{detailedStats?.battingStats?.highestScore || 0}</p>
        </div>
        <div className="card bg-white p-4">
          <h3 className="text-gray-500 font-medium text-sm flex items-center">
            <FaHandsHelping className="text-purple-500 mr-1 h-3 w-3" />
            Fielding
          </h3>
          <p className="text-3xl font-bold">{detailedStats?.fieldingStats?.totalContributions || 0}</p>
        </div>
      </div>
      
      {/* Performance Trend */}
      <div className="card bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Performance</h2>
        {performanceTrend.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceTrend}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#1e56a0" />
                <YAxis yAxisId="right" orientation="right" stroke="#ff4e50" />
                <YAxis yAxisId="fielding" orientation="right" stroke="#8b5cf6" domain={[0, 'dataMax + 2']} />
                <Tooltip content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 shadow-md rounded border border-gray-200">
                        <p className="text-sm font-medium">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="runs" name="Runs Scored" fill="#1e56a0" />
                <Bar yAxisId="right" dataKey="wickets" name="Wickets Taken" fill="#ff4e50" />
                <Bar yAxisId="fielding" dataKey="fielding" name="Fielding" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No performance trend data available yet.</p>
          </div>
        )}
      </div>
      
      {/* Recent Performance Table */}
      <div className="card bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Performances</h2>
        <div className="overflow-x-auto">
          {recentMatches.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wickets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Economy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fielding</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentMatches.map((match) => (
                  <tr key={match.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(match.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{match.opponent}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{match.format}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{match.stats.runs}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{match.stats.wickets}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{match.stats.overs}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{match.stats.economy.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-purple-600">
                        {(match.stats.catches > 0 || match.stats.runOuts > 0 || match.stats.stumpings > 0) ? (
                          <span className="flex items-center">
                            <FaHandsHelping className="h-3 w-3 mr-1" />
                            {match.stats.catches > 0 && `${match.stats.catches}C`}
                            {match.stats.catches > 0 && (match.stats.runOuts > 0 || match.stats.stumpings > 0) && ' '}
                            {match.stats.runOuts > 0 && `${match.stats.runOuts}RO`}
                            {match.stats.runOuts > 0 && match.stats.stumpings > 0 && ' '}
                            {match.stats.stumpings > 0 && `${match.stats.stumpings}ST`}
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No recent matches available.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed Stats */}
      {detailedStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Batting Stats */}
          <div className="card bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">Batting Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Total Runs</span>
                <span className="font-medium">{detailedStats.battingStats.totalRuns}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Highest Score</span>
                <span className="font-medium">{detailedStats.battingStats.highestScore}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Batting Average</span>
                <span className="font-medium">{detailedStats.battingStats.battingAverage?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Strike Rate</span>
                <span className="font-medium">{detailedStats.battingStats.strikeRate?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">50s / 100s</span>
                <span className="font-medium">{detailedStats.battingStats.fifties} / {detailedStats.battingStats.hundreds}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">4s / 6s</span>
                <span className="font-medium">{detailedStats.battingStats.totalFours} / {detailedStats.battingStats.totalSixes}</span>
              </div>
            </div>
          </div>
          
          {/* Bowling Stats */}
          <div className="card bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">Bowling Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Total Wickets</span>
                <span className="font-medium">{detailedStats.bowlingStats.totalWickets}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Best Figures</span>
                <span className="font-medium">{detailedStats.bowlingStats.bestFigures}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Bowling Average</span>
                <span className="font-medium">{detailedStats.bowlingStats.bowlingAverage?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Economy Rate</span>
                <span className="font-medium">{detailedStats.bowlingStats.economy?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Total Overs</span>
                <span className="font-medium">{detailedStats.bowlingStats.totalOvers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Maidens</span>
                <span className="font-medium">{detailedStats.bowlingStats.totalMaidens}</span>
              </div>
            </div>
          </div>
          
          {/* Fielding Stats */}
          <div className="card bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaHandsHelping className="text-purple-500 mr-2" /> 
              Fielding Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Total Catches</span>
                <span className="font-medium">{detailedStats.fieldingStats?.totalCatches || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Total Run Outs</span>
                <span className="font-medium">{detailedStats.fieldingStats?.totalRunOuts || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Total Stumpings</span>
                <span className="font-medium">{detailedStats.fieldingStats?.totalStumpings || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2 bg-purple-50 p-2 rounded">
                <span className="text-purple-700 font-medium">Total Contributions</span>
                <span className="font-bold text-purple-700">{detailedStats.fieldingStats?.totalContributions || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Best in a Match</span>
                <span className="font-medium">{detailedStats.fieldingStats?.bestFieldingInMatch || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. per Match</span>
                <span className="font-medium">{detailedStats.fieldingStats?.avgFieldingPerMatch?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button className="btn btn-outline">Export Statistics</button>
      </div>
    </div>
  );
};

export default Statistics; 