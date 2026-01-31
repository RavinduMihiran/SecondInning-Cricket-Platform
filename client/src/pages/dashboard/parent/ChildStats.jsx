import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaSpinner, FaChartLine, FaArrowLeft } from 'react-icons/fa';
import { getPlayerStats, getChildDetails } from '../../../services/parentService';

const ChildStats = () => {
  const { playerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [childDetails, setChildDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch player details
        const details = await getChildDetails(playerId);
        setChildDetails(details);
        
        // Fetch player stats
        const statsData = await getPlayerStats(playerId);
        setStats(statsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching child stats:', err);
        setError('Failed to load statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchData();
    }
  }, [playerId]);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center mb-4">
        <Link
          to={`/dashboard/parent/child/${playerId}`}
          className="text-primary hover:underline flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Child Profile
        </Link>
      </div>
      
      {/* Child Profile Header */}
      {childDetails && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
          <div className="relative mr-4">
            {childDetails.player.profileImage ? (
              <img
                src={childDetails.player.profileImage}
                alt={childDetails.player.name}
                className="h-16 w-16 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-500">
                  {getInitials(childDetails.player.name)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{childDetails.player.name}</h1>
            <p className="text-gray-600 text-sm">
              {childDetails.player.school && `${childDetails.player.school}`}
              {childDetails.player.school && childDetails.player.district && ` • `}
              {childDetails.player.district && `${childDetails.player.district}`}
            </p>
          </div>
        </div>
      )}
      
      {/* Stats Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaChartLine className="mr-2 text-blue-500" /> Performance Statistics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm text-blue-700 font-medium">Batting</h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {childDetails?.player?.stats?.battingAvg?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-blue-600">Average</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {childDetails?.player?.stats?.runs || '0'}
                </div>
                <p className="text-xs text-blue-600">Total Runs</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {childDetails?.player?.stats?.highestScore || '0'}
                </div>
                <p className="text-xs text-blue-600">Highest Score</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {childDetails?.player?.stats?.battingStrikeRate?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-blue-600">Strike Rate</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm text-green-700 font-medium">Bowling</h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {childDetails?.player?.stats?.bowlingAvg?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-green-600">Average</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {childDetails?.player?.stats?.wickets || '0'}
                </div>
                <p className="text-xs text-green-600">Total Wickets</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {childDetails?.player?.stats?.economy?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-green-600">Economy</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {childDetails?.player?.stats?.bestBowling || '0/0'}
                </div>
                <p className="text-xs text-green-600">Best Bowling</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Match Stats Table */}
        <h3 className="text-md font-medium mb-3">Match Statistics</h3>
        
        {stats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="py-2 px-3 text-left">Date</th>
                  <th className="py-2 px-3 text-left">Opponent</th>
                  <th className="py-2 px-3 text-center">Batting</th>
                  <th className="py-2 px-3 text-center">Bowling</th>
                  <th className="py-2 px-3 text-center">Fielding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.map((stat) => (
                  <tr key={stat._id} className="hover:bg-gray-50">
                    <td className="py-3 px-3 text-sm">
                      {formatDate(stat.match.date)}
                    </td>
                    <td className="py-3 px-3 text-sm">
                      {stat.match.opponent || 'Unknown'}
                    </td>
                    <td className="py-3 px-3 text-sm text-center">
                      <span className="font-medium">{stat.batting.runs}</span>
                      <span className="text-gray-500 text-xs"> ({stat.batting.balls})</span>
                      {stat.batting.notOut && <span className="text-green-500">*</span>}
                      <div className="text-xs text-gray-500">
                        {stat.batting.fours}×4s, {stat.batting.sixes}×6s
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-center">
                      <span className="font-medium">{stat.bowling.wickets}/{stat.bowling.runs}</span>
                      <div className="text-xs text-gray-500">
                        {stat.bowling.overs} overs
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-center">
                      <span className="font-medium">{stat.fielding.catches}</span> catches
                      {stat.fielding.runouts > 0 && (
                        <div className="text-xs text-gray-500">
                          {stat.fielding.runouts} run outs
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No match statistics available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildStats; 