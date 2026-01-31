import { useState, useEffect, useContext, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { FaCalendarAlt, FaChartLine, FaTrophy, FaRunning, FaList, FaArrowRight, FaPlusCircle, FaSpinner, FaSync, FaBell, FaHandsHelping } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getStatsSummary, getRecentMatches, getPerformanceTrend } from '../../services/statsService';
import { NotificationContext } from '../../contexts/NotificationContext';
import { SocketContext } from '../../contexts/SocketContext';
import ConnectionStatus from '../../components/ConnectionStatus';
import StatsRecordModal from '../../components/StatsRecordModal';

const DashboardHome = () => {
  // State for data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsSummary, setStatsSummary] = useState({
    totalMatches: 0,
    recentMatches: 0,
    battingAverage: 0,
    battingAvgChange: 0,
    totalRuns: 0,
    seasonRuns: 0,
    totalWickets: 0,
    seasonWickets: 0,
    totalFielding: 0,  // Total fielding contributions
    seasonFielding: 0  // Season fielding contributions
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [newAnnouncementIds, setNewAnnouncementIds] = useState(new Set());
  
  // Get announcements from NotificationContext
  const { allAnnouncements, refreshAnnouncements } = useContext(NotificationContext);
  const { socket, isConnected } = useContext(SocketContext);
  const announcementsRef = useRef(null);

  // Fetch all data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for new stats updates
      socket.on('stats_updated', () => {
        console.log('Received real-time stats update');
        fetchDashboardData();
      });
      
      // Listen for new achievements
      socket.on('achievement_unlocked', (data) => {
        console.log('New achievement unlocked:', data);
        // Could show a toast notification here
        toast.success(`Achievement unlocked: ${data.title}`);
        // Refresh data
        fetchDashboardData();
      });
      
      // Clean up listeners on unmount
      return () => {
        socket.off('stats_updated');
        socket.off('achievement_unlocked');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [summaryData, matchesData, performanceData] = await Promise.all([
        getStatsSummary().catch(err => {
          console.error('Error fetching stats summary:', err);
          return {
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
          };
        }),
        getRecentMatches(3).catch(err => {
          console.error('Error fetching recent matches:', err);
          return [];
        }),
        getPerformanceTrend().catch(err => {
          console.error('Error fetching performance trend:', err);
          return [];
        })
      ]);
      
      setStatsSummary(summaryData || {});
      setRecentMatches(matchesData || []);
      setPerformanceData(performanceData || []);
      
      // Also refresh announcements from context
      await refreshAnnouncements();
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      // Set default values to prevent rendering errors
      setStatsSummary({
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
      setRecentMatches([]);
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnnouncements = async () => {
    setRefreshing(true);
    try {
      await refreshAnnouncements();
    } catch (err) {
      console.error('Error refreshing announcements:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };
  
  // Check if an announcement is new (received via socket)
  const isNewAnnouncement = (id) => {
    return newAnnouncementIds.has(id);
  };
  
  // Clear new announcement indicator
  const clearNewIndicator = (id) => {
    setNewAnnouncementIds(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  const handleStatsAdded = (updatedStats) => {
    // Refresh dashboard data after adding new stats
    fetchDashboardData();
  };
    
  // Convert date string to formatted date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-100 text-xs">
          <p className="font-medium text-gray-700 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium">{entry.name}: </span>
              <span className="ml-1">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <button 
          onClick={() => setIsStatsModalOpen(true)}
          className="btn btn-primary text-sm py-1.5 px-4 flex items-center gap-1"
        >
          <FaPlusCircle className="h-3.5 w-3.5" /> Add New Stats
        </button>
      </div>
      
      {/* Stats Record Modal */}
      <StatsRecordModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onStatsAdded={handleStatsAdded}
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 slide-up overflow-x-auto">
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="stat-label">Total Matches</h3>
            <div className="stat-icon bg-primary-light">
              <FaCalendarAlt className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end">
            <span className="stat-value">{statsSummary.totalMatches}</span>
            <span className="text-success text-xs ml-2 font-medium">
              +{statsSummary.recentMatches} this month
            </span>
          </div>
        </div>
        
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="stat-label">Batting Average</h3>
            <div className="stat-icon bg-secondary">
              <FaChartLine className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end">
            <span className="stat-value">{statsSummary.battingAverage?.toFixed(1) || '0.0'}</span>
            <span className={`text-xs ml-2 font-medium ${statsSummary.battingAvgChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {statsSummary.battingAvgChange >= 0 ? '+' : ''}{statsSummary.battingAvgChange?.toFixed(1) || '0.0'}
            </span>
          </div>
        </div>
        
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="stat-label">Total Runs</h3>
            <div className="stat-icon bg-success">
              <FaRunning className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end">
            <span className="stat-value">{statsSummary.totalRuns}</span>
            <span className="text-success text-xs ml-2 font-medium">
              +{statsSummary.seasonRuns} this season
            </span>
          </div>
        </div>
        
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="stat-label">Total Wickets</h3>
            <div className="stat-icon bg-info">
              <FaTrophy className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end">
            <span className="stat-value">{statsSummary.totalWickets}</span>
            <span className="text-success text-xs ml-2 font-medium">
              +{statsSummary.seasonWickets} this season
            </span>
          </div>
        </div>
        
        {/* Fielding Stats Card */}
        <div className="stat-card bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="stat-label">Fielding</h3>
            <div className="stat-icon bg-purple-500">
              <FaHandsHelping className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="stat-value">{statsSummary.totalFielding || 0}</span>
            <div className="flex items-center text-success text-xs font-medium">
              <span>+{statsSummary.seasonFielding || 0} this season</span>
            </div>
            {statsSummary.totalMatches > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-300 mr-1"></span>
                  Avg: {(statsSummary.totalFielding / statsSummary.totalMatches).toFixed(1)} per match
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Performance Chart */}
      <div className="card bg-white p-5 shadow-sm mb-6 slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-800">Performance Trend</h2>
          <button 
            onClick={fetchDashboardData}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
            title="Refresh data"
          >
            <FaSync className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="h-72">
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="runs" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="wickets" orientation="right" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="fielding" orientation="right" domain={[0, 'dataMax + 1']} hide />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="runs" 
                  yAxisId="runs"
                  name="Runs" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: 'white' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="wickets" 
                  yAxisId="wickets"
                  name="Wickets" 
                  stroke="#e11d48" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, stroke: '#e11d48', strokeWidth: 2, fill: 'white' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="fielding" 
                  yAxisId="fielding"
                  name="Fielding" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No performance data available</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <div className="card bg-white p-5 shadow-sm slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Recent Matches</h2>
            <Link to="/dashboard/statistics" className="text-primary text-xs flex items-center hover:underline">
              See all <FaArrowRight className="ml-1 h-2.5 w-2.5" />
            </Link>
          </div>
          {recentMatches.length > 0 ? (
            <div className="space-y-4">
              {recentMatches.map((match) => (
                <div key={match.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">vs {match.opponent}</h3>
                      <p className="text-xs text-gray-500">{formatDate(match.date)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-secondary">{match.stats.runs} runs</span>
                      {match.stats.wickets > 0 && (
                        <span className="text-sm font-medium text-primary ml-3">{match.stats.wickets} wickets</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <div>
                      {match.stats.overs > 0 && (
                        <span>
                          {match.stats.overs} overs, economy: {match.stats.economy?.toFixed(1) || '0.0'}
                        </span>
                      )}
                    </div>
                    {/* Show fielding stats if available */}
                    {(match.stats.catches > 0 || match.stats.runOuts > 0 || match.stats.stumpings > 0) && (
                      <div className="text-purple-600 font-medium flex items-center">
                        <FaHandsHelping className="h-3 w-3 mr-1" />
                        <span>
                          {match.stats.catches > 0 && `${match.stats.catches}C`}
                          {match.stats.catches > 0 && (match.stats.runOuts > 0 || match.stats.stumpings > 0) && ' '}
                          {match.stats.runOuts > 0 && `${match.stats.runOuts}RO`}
                          {match.stats.runOuts > 0 && match.stats.stumpings > 0 && ' '}
                          {match.stats.stumpings > 0 && `${match.stats.stumpings}ST`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent matches</p>
              <button 
                onClick={() => setIsStatsModalOpen(true)}
                className="btn btn-outline btn-sm mt-2"
              >
                Add Match Stats
              </button>
            </div>
          )}
        </div>
        
        {/* Announcements */}
        <div className="card bg-white p-5 shadow-sm slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center">
              Announcements
              {isConnected && (
                <span className="ml-2 h-2 w-2 bg-green-500 rounded-full" title="Connected for real-time updates"></span>
              )}
            </h2>
            <div className="flex items-center">
              <button 
                onClick={handleRefreshAnnouncements}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                disabled={refreshing}
                title="Refresh announcements"
              >
                <FaSync className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link to="/dashboard/announcements" className="text-primary text-xs flex items-center hover:underline ml-3">
                See all <FaArrowRight className="ml-1 h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto" ref={announcementsRef}>
            {allAnnouncements.length > 0 ? (
              allAnnouncements.slice(0, 3).map((announcement) => (
                <div 
                  key={announcement._id} 
                  className={`p-3 rounded-md border ${
                    isNewAnnouncement(announcement._id) 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => clearNewIndicator(announcement._id)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium">{announcement.title}</h3>
                    {isNewAnnouncement(announcement._id) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(announcement.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaBell className="mx-auto text-3xl mb-2 text-gray-300" />
                <p>No announcements yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome; 