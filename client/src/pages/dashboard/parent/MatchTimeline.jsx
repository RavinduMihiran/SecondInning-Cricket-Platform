import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaSpinner, FaHistory, FaArrowLeft, FaCalendarAlt, FaTrophy, FaMedal } from 'react-icons/fa';
import { getPlayerStats, getChildDetails } from '../../../services/parentService';

const MatchTimeline = () => {
  const { playerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [childDetails, setChildDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch player details
        const details = await getChildDetails(playerId);
        setChildDetails(details);
        
        // Fetch player stats (which contain match data)
        const statsData = await getPlayerStats(playerId);
        
        // Sort matches by date (newest first)
        const sortedMatches = [...statsData].sort((a, b) => {
          return new Date(b.match.date) - new Date(a.match.date);
        });
        
        setMatches(sortedMatches);
        setError(null);
      } catch (err) {
        console.error('Error fetching match timeline:', err);
        setError('Failed to load match timeline. Please try again.');
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

  // Get performance rating based on stats
  const getPerformanceRating = (stat) => {
    // Simple algorithm to rate performance
    let rating = 0;
    
    // Batting rating (0-5)
    const battingRating = Math.min(5, Math.floor(stat.batting.runs / 15));
    
    // Bowling rating (0-5)
    const bowlingRating = Math.min(5, stat.bowling.wickets * 2);
    
    // Overall rating - take the better of the two
    rating = Math.max(battingRating, bowlingRating);
    
    return rating;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading match timeline...</p>
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
      
      {/* Match Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaHistory className="mr-2 text-blue-500" /> Match Timeline
        </h2>
        
        {matches.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
            
            {/* Timeline items */}
            <div className="space-y-8">
              {matches.map((match, index) => {
                const performanceRating = getPerformanceRating(match);
                
                return (
                  <div key={match._id} className="relative z-10">
                    {/* Date circle */}
                    <div className="absolute left-6 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white"></div>
                    
                    <div className="ml-12 bg-white rounded-lg border border-gray-200 p-4">
                      {/* Match header */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-2" />
                          <span className="font-medium">{formatDate(match.match.date)}</span>
                        </div>
                        
                        {/* Performance rating */}
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              className={`w-4 h-4 ${i < performanceRating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      
                      {/* Match details */}
                      <h3 className="font-semibold text-lg mb-2">
                        {match.match.opponent ? `vs ${match.match.opponent}` : 'Match'}
                        {match.match.venue && ` at ${match.match.venue}`}
                      </h3>
                      
                      {match.match.result && (
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3
                          ${match.match.result === 'win' ? 'bg-green-100 text-green-800' : 
                            match.match.result === 'loss' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }
                        `}>
                          {match.match.result.charAt(0).toUpperCase() + match.match.result.slice(1)}
                        </div>
                      )}
                      
                      {/* Performance stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div className="bg-blue-50 p-3 rounded-md">
                          <h4 className="text-xs text-blue-700 font-medium mb-1">Batting</h4>
                          <div className="text-xl font-bold text-blue-900">
                            {match.batting.runs}
                            <span className="text-sm text-blue-700 font-normal ml-1">
                              ({match.batting.balls} balls)
                            </span>
                            {match.batting.notOut && <span className="text-green-500">*</span>}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {match.batting.fours} fours, {match.batting.sixes} sixes
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-md">
                          <h4 className="text-xs text-green-700 font-medium mb-1">Bowling</h4>
                          <div className="text-xl font-bold text-green-900">
                            {match.bowling.wickets}/{match.bowling.runs}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            {match.bowling.overs} overs, {match.bowling.maidens} maidens
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <h4 className="text-xs text-yellow-700 font-medium mb-1">Fielding</h4>
                          <div className="text-xl font-bold text-yellow-900">
                            {match.fielding.catches} catches
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            {match.fielding.runouts} run outs, {match.fielding.stumpings} stumpings
                          </div>
                        </div>
                      </div>
                      
                      {/* Achievements in this match */}
                      {match.achievements && match.achievements.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-sm font-medium flex items-center mb-2">
                            <FaTrophy className="text-yellow-500 mr-1" /> Achievements
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {match.achievements.map((achievement, i) => (
                              <div key={i} className="flex items-center bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded">
                                <FaMedal className="mr-1" /> {achievement}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Coach notes if available */}
                      {match.notes && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-sm font-medium mb-1">Coach Notes:</h4>
                          <p className="text-sm text-gray-600">{match.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No match data available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchTimeline; 