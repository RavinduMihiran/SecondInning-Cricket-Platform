import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaSpinner, FaUser, FaArrowLeft, FaPlus, FaTimes, FaStar, FaSearch } from 'react-icons/fa';
import { comparePlayers, searchPlayers } from '../../../services/coachService';

const ComparePlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        
        // Get player IDs from URL parameters
        const playerIds = searchParams.get('players')?.split(',').filter(Boolean) || [];
        
        if (playerIds.length === 0) {
          setPlayers([]);
          setLoading(false);
          return;
        }
        
        console.log('Fetching comparison data for players:', playerIds);
        
        // Fetch player comparison data
        const data = await comparePlayers(playerIds);
        console.log('Comparison data received:', data);
        
        if (!data || data.length === 0) {
          setError('No player data found. Please try different players.');
          setPlayers([]);
        } else {
          setPlayers(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching player comparison:', err);
        setError('Failed to load player comparison data. Please try again.');
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [searchParams]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      setError(null);
      
      const searchParams = {
        query: searchQuery,
        limit: 8 // Increased from 5 to show more options
      };
      
      console.log('Searching for players with query:', searchQuery);
      const data = await searchPlayers(searchParams);
      console.log('Search results received:', data);
      
      if (data.players && data.players.length > 0) {
        setSearchResults(data.players);
      } else {
        setSearchResults([]);
        setError('No players found matching your search criteria');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error searching players:', err);
      
      // Improved error message with more details
      let errorMessage = 'Failed to search players. Please try again.';
      
      if (err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = `Server error: ${err.response.data.message}`;
          
          // Add more details if available
          if (err.response.data.error) {
            errorMessage += ` (${err.response.data.error})`;
          }
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      setSearchResults([]);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addPlayerToComparison = (player) => {
    // Get current player IDs
    const playerIds = players.map(p => p.profile._id);
    
    // Add new player if not already in comparison and less than 4 players
    if (!playerIds.includes(player._id) && playerIds.length < 4) {
      console.log('Adding player to comparison:', player.name, player._id);
      
      // Navigate to new URL with updated player list
      const newPlayerIds = [...playerIds, player._id];
      
      // Show loading state
      setLoading(true);
      
      // Use navigate with search params to update URL and trigger data reload
      navigate({
        pathname: '/dashboard/coach/compare-players',
        search: `?players=${newPlayerIds.join(',')}`
      });
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
    } else {
      // Show feedback to user
      if (playerIds.includes(player._id)) {
        setError('Player is already in the comparison');
        setTimeout(() => setError(null), 3000);
      }
      if (playerIds.length >= 4) {
        setError('Maximum of 4 players can be compared at once');
        setTimeout(() => setError(null), 3000);
      }
      
      // Clear search anyway
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removePlayerFromComparison = (playerId) => {
    // Filter out the removed player
    console.log('Removing player from comparison:', playerId);
    const updatedPlayerIds = players
      .map(p => p.profile._id)
      .filter(id => id !== playerId);
    
    console.log('Updated player IDs:', updatedPlayerIds);
    
    // Show loading state
    setLoading(true);
    
    if (updatedPlayerIds.length === 0) {
      console.log('No players left, redirecting to player search');
      navigate('/dashboard/coach/player-search');
    } else {
      console.log('Updating URL with remaining players');
      navigate({
        pathname: '/dashboard/coach/compare-players',
        search: `?players=${updatedPlayerIds.join(',')}`
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading comparison data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Compare Players</h1>
        </div>
        
        <Link 
          to="/dashboard/coach/player-search" 
          className="btn btn-outline flex items-center"
        >
          <FaSearch className="mr-2" />
          Back to Player Search
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Add Player Section */}
      {players.length < 4 && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search for a player to add to comparison..."
                className="input pl-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              className="ml-2 btn btn-primary flex items-center"
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? <FaSpinner className="animate-spin mr-2" /> : null}
              Search
            </button>
          </div>

          {/* Search Results with improved UI */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm max-h-72 overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                Click on a player to add to comparison ({players.length}/4 selected)
              </div>
              {searchResults.map(player => (
                <div 
                  key={player._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => addPlayerToComparison(player)}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mr-3">
                      {player.profileImage ? (
                        <img 
                          src={player.profileImage} 
                          alt={player.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaUser className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-500">
                        {player.age ? `${player.age} years` : ''} 
                        {player.school ? ` • ${player.school}` : ''}
                        {player.stats ? ` • Runs: ${player.stats.runs || 0}` : ''}
                        {player.stats ? ` • Wickets: ${player.stats.wickets || 0}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Add to comparison</span>
                    <FaPlus className="text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {players.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comparison
                  </th>
                  {players.map((player) => (
                    <th 
                      key={player.profile._id} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mr-2">
                            {player.profile.profileImage ? (
                              <img 
                                src={player.profile.profileImage} 
                                alt={player.profile.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FaUser className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <span>{player.profile.name}</span>
                        </div>
                        <button 
                          onClick={() => removePlayerFromComparison(player.profile._id)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                          aria-label={`Remove ${player.profile.name} from comparison`}
                          title={`Remove ${player.profile.name} from comparison`}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Profile Section */}
                <tr className="bg-gray-50">
                  <td colSpan={players.length + 1} className="px-6 py-2 text-sm font-medium text-gray-700">
                    Profile
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Age</td>
                  {players.map((player) => (
                    <td key={`${player.profile._id}-age`} className="px-6 py-3 text-sm">
                      {player.profile.age || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">School</td>
                  {players.map((player) => (
                    <td key={`${player.profile._id}-school`} className="px-6 py-3 text-sm">
                      {player.profile.school || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">District</td>
                  {players.map((player) => (
                    <td key={`${player.profile._id}-district`} className="px-6 py-3 text-sm">
                      {player.profile.district || 'N/A'}
                    </td>
                  ))}
                </tr>
                
                {/* Batting Stats Section */}
                <tr className="bg-gray-50">
                  <td colSpan={players.length + 1} className="px-6 py-2 text-sm font-medium text-gray-700">
                    Batting Stats
                  </td>
                </tr>
                
                {/* Total Runs */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Total Runs</td>
                  {players.map((player) => {
                    // Find max value for highlighting
                    const maxRuns = Math.max(...players.map(p => p.battingStats?.totalRuns || 0));
                    const isHighest = player.battingStats?.totalRuns === maxRuns && maxRuns > 0;
                    
                    return (
                      <td 
                        key={`${player.profile._id}-runs`} 
                        className={`px-6 py-3 text-sm ${isHighest ? 'font-bold text-green-600' : ''}`}
                      >
                        {player.battingStats?.totalRuns || 0}
                        {isHighest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>
                
                {/* Highest Score */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Highest Score</td>
                  {players.map((player) => {
                    // Find max value for highlighting
                    const maxScore = Math.max(...players.map(p => p.battingStats?.highestScore || 0));
                    const isHighest = player.battingStats?.highestScore === maxScore && maxScore > 0;
                    
                    return (
                      <td 
                        key={`${player.profile._id}-highest`} 
                        className={`px-6 py-3 text-sm ${isHighest ? 'font-bold text-green-600' : ''}`}
                      >
                        {player.battingStats?.highestScore || 0}
                        {isHighest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>
                
                {/* Batting Average */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Batting Average</td>
                  {players.map((player) => {
                    // Find max value for highlighting
                    const maxAvg = Math.max(...players.map(p => p.battingStats?.battingAverage || 0));
                    const isHighest = player.battingStats?.battingAverage === maxAvg && maxAvg > 0;
                    
                    return (
                      <td 
                        key={`${player.profile._id}-avg`} 
                        className={`px-6 py-3 text-sm ${isHighest ? 'font-bold text-green-600' : ''}`}
                      >
                        {player.battingStats?.battingAverage?.toFixed(2) || '0.00'}
                        {isHighest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>
                
                {/* Strike Rate */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Strike Rate</td>
                  {players.map((player) => {
                    // Find max value for highlighting
                    const maxSR = Math.max(...players.map(p => parseFloat(p.battingStats?.strikeRate || 0)));
                    const isHighest = parseFloat(player.battingStats?.strikeRate) === maxSR && maxSR > 0;
                    
                    return (
                      <td 
                        key={`${player.profile._id}-sr`} 
                        className={`px-6 py-3 text-sm ${isHighest ? 'font-bold text-green-600' : ''}`}
                      >
                        {player.battingStats?.strikeRate || '0.00'}
                        {isHighest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>
                
                {/* 50s and 100s */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">50s / 100s</td>
                  {players.map((player) => {
                    const fifties = player.battingStats?.fifties || 0;
                    const hundreds = player.battingStats?.hundreds || 0;
                    
                    // Find max values for highlighting
                    const maxFifties = Math.max(...players.map(p => p.battingStats?.fifties || 0));
                    const maxHundreds = Math.max(...players.map(p => p.battingStats?.hundreds || 0));
                    
                    const isMostFifties = fifties === maxFifties && maxFifties > 0;
                    const isMostHundreds = hundreds === maxHundreds && maxHundreds > 0;
                    
                    return (
                      <td key={`${player.profile._id}-50s100s`} className="px-6 py-3 text-sm">
                        <span className={isMostFifties ? 'font-bold text-green-600' : ''}>{fifties}</span>
                        {' / '}
                        <span className={isMostHundreds ? 'font-bold text-green-600' : ''}>{hundreds}</span>
                        {(isMostFifties || isMostHundreds) && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>

                {/* Bowling Stats Section */}
                <tr className="bg-gray-50">
                  <td colSpan={players.length + 1} className="px-6 py-2 text-sm font-medium text-gray-700">
                    Bowling Stats
                  </td>
                </tr>
                
                {/* Total Wickets */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Total Wickets</td>
                  {players.map((player) => {
                    // Find max value for highlighting
                    const maxWickets = Math.max(...players.map(p => p.bowlingStats?.totalWickets || 0));
                    const isHighest = player.bowlingStats?.totalWickets === maxWickets && maxWickets > 0;
                    
                    return (
                      <td 
                        key={`${player.profile._id}-wickets`} 
                        className={`px-6 py-3 text-sm ${isHighest ? 'font-bold text-green-600' : ''}`}
                      >
                        {player.bowlingStats?.totalWickets || 0}
                        {isHighest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>
                
                {/* Best Bowling Figures */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Best Figures</td>
                  {players.map((player) => (
                    <td key={`${player.profile._id}-best`} className="px-6 py-3 text-sm">
                      {player.bowlingStats?.bestFigures || '0/0'}
                    </td>
                  ))}
                </tr>
                
                {/* Bowling Average */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Bowling Average</td>
                  {players.map((player) => {
                    // For bowling average, lower is better
                    const minAvg = Math.min(...players.map(p => {
                      const avg = p.bowlingStats?.bowlingAverage || 0;
                      return avg > 0 ? avg : Infinity;
                    }).filter(avg => avg !== Infinity));
                    
                    const isBest = player.bowlingStats?.bowlingAverage === minAvg && minAvg !== Infinity;
                    
                    return (
                      <td 
                        key={`${player.profile._id}-bowl-avg`} 
                        className={`px-6 py-3 text-sm ${isBest ? 'font-bold text-green-600' : ''}`}
                      >
                        {player.bowlingStats?.bowlingAverage?.toFixed(2) || '0.00'}
                        {isBest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>
                
                {/* Economy Rate */}
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-500">Economy Rate</td>
                  {players.map((player) => {
                    // For economy, lower is better
                    const minEconomy = Math.min(...players.map(p => {
                      const eco = parseFloat(p.bowlingStats?.economy || 0);
                      return eco > 0 ? eco : Infinity;
                    }).filter(eco => eco !== Infinity));
                    
                    const isBest = parseFloat(player.bowlingStats?.economy) === minEconomy && minEconomy !== Infinity;
                    
                    return (
                      <td 
                        key={`${player.profile._id}-economy`} 
                        className={`px-6 py-3 text-sm ${isBest ? 'font-bold text-green-600' : ''}`}
                      >
                        {player.bowlingStats?.economy || '0.00'}
                        {isBest && <span className="ml-1 text-xs">🏆</span>}
                      </td>
                    );
                  })}
                </tr>

                {/* Coach Ratings Section - if available */}
                {players.some(player => player.rating) && (
                  <>
                    <tr className="bg-gray-50">
                      <td colSpan={players.length + 1} className="px-6 py-2 text-sm font-medium text-gray-700">
                        Your Ratings
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="px-6 py-3 text-sm text-gray-500">Overall</td>
                      {players.map((player) => (
                        <td key={`${player.profile._id}-rating-overall`} className="px-6 py-3">
                          {player.rating?.overall ? (
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{player.rating.overall}/10</span>
                              <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${(player.rating.overall / 10) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : 'Not rated'}
                        </td>
                      ))}
                    </tr>
                    
                    <tr>
                      <td className="px-6 py-3 text-sm text-gray-500">Batting</td>
                      {players.map((player) => (
                        <td key={`${player.profile._id}-rating-batting`} className="px-6 py-3">
                          {player.rating?.batting ? (
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{player.rating.batting}/10</span>
                              <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${(player.rating.batting / 10) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : 'Not rated'}
                        </td>
                      ))}
                    </tr>
                    
                    <tr>
                      <td className="px-6 py-3 text-sm text-gray-500">Bowling</td>
                      {players.map((player) => (
                        <td key={`${player.profile._id}-rating-bowling`} className="px-6 py-3">
                          {player.rating?.bowling ? (
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{player.rating.bowling}/10</span>
                              <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${(player.rating.bowling / 10) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : 'Not rated'}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="text-gray-500 mb-4">
            No players selected for comparison
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Use the search box above to find and add up to 4 players to compare their stats side by side.
          </p>
          <Link 
            to="/dashboard/coach/player-search" 
            className="btn btn-primary flex items-center justify-center mx-auto"
            style={{ maxWidth: '200px' }}
          >
            <FaSearch className="mr-2" />
            Browse Players
          </Link>
        </div>
      )}
    </div>
  );
};

export default ComparePlayer; 