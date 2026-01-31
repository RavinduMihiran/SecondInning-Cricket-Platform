import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaStar, FaEye, FaEyeSlash, FaSpinner, FaUser, FaSort, FaSortUp, FaSortDown, FaExchangeAlt, FaCheck, FaPlus, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import DistrictFilter from '../../../components/DistrictFilter';

const PlayerSearch = () => {
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    region: '',
    school: '',
    minRuns: '',
    maxRuns: '',
    minWickets: '',
    maxWickets: '',
    minBattingAvg: '',
    maxBattingAvg: '',
    minBowlingAvg: '',
    maxBowlingAvg: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('runs');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Data state
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Comparison state
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const maxCompareCount = 4;

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter input change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with default desc order
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get sort icon based on current sort state
  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === 'asc' ? <FaSortUp className="text-primary" /> : <FaSortDown className="text-primary" />;
  };

  // Handle search submit
  const handleSearch = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = {
        query: searchQuery,
        page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };
      
      // Add filters if they have values
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      
      const response = await axios.get('/api/coaches/players/search', { params });
      
      setPlayers(response.data.players);
      setPagination({
        ...pagination,
        page: response.data.pagination.page,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      });
    } catch (err) {
      console.error('Error searching players:', err);
      setError('Failed to search players. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      handleSearch(newPage);
    }
  };

  // Add/remove player from watchlist
  const toggleWatchlist = async (playerId, inWatchlist) => {
    try {
      if (inWatchlist) {
        await axios.delete(`/api/coaches/watchlist/remove/${playerId}`);
      } else {
        await axios.post(`/api/coaches/watchlist/add/${playerId}`);
      }
      
      // Update local state
      setPlayers(players.map(player => 
        player._id === playerId 
          ? { ...player, inWatchlist: !inWatchlist } 
          : player
      ));
    } catch (err) {
      console.error('Error updating watchlist:', err);
    }
  };
  
  // Handle player selection for comparison
  const togglePlayerSelection = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      // Remove player from selection
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      // Add player to selection if under the limit
      if (selectedPlayers.length < maxCompareCount) {
        setSelectedPlayers([...selectedPlayers, playerId]);
      } else {
        // Show error or notification that max players are selected
        alert(`You can only compare up to ${maxCompareCount} players at once.`);
      }
    }
  };
  
  // Navigate to compare players page with selected players
  const navigateToCompare = () => {
    if (selectedPlayers.length > 0) {
      navigate(`/dashboard/coach/compare-players?players=${selectedPlayers.join(',')}`);
    } else {
      alert('Please select at least one player to compare.');
    }
  };
  
  // Add single player to comparison and navigate
  const addToCompare = (playerId) => {
    navigate(`/dashboard/coach/compare-players?players=${playerId}`);
  };

  // Initial search on component mount
  useEffect(() => {
    handleSearch();
  }, [sortBy, sortOrder]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Player Search</h1>
        
        {/* Compare button in header */}
        <button
          onClick={navigateToCompare}
          disabled={selectedPlayers.length === 0}
          className={`btn ${selectedPlayers.length > 0 ? 'btn-primary' : 'btn-disabled'} flex items-center`}
        >
          <FaExchangeAlt className="mr-2" />
          Compare Selected ({selectedPlayers.length}/{maxCompareCount})
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search players by name, school, or district..."
              className="input pl-10"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            className="ml-2 btn btn-primary flex items-center"
            onClick={() => handleSearch()}
          >
            Search
          </button>
          <button
            className={`ml-2 btn ${showFilters ? 'btn-secondary' : 'btn-outline'} flex items-center`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Demographics</h3>
              
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="label">Min Age</label>
                  <input
                    type="number"
                    name="minAge"
                    placeholder="Min"
                    className="input"
                    value={filters.minAge}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="w-1/2">
                  <label className="label">Max Age</label>
                  <input
                    type="number"
                    name="maxAge"
                    placeholder="Max"
                    className="input"
                    value={filters.maxAge}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Region/District</label>
                <DistrictFilter
                  selectedDistrict={filters.region}
                  onDistrictChange={(district) => setFilters(prev => ({ ...prev, region: district }))}
                  label="Filter by District"
                  showLabel={false}
                />
              </div>
              
              <div>
                <label className="label">School</label>
                <input
                  type="text"
                  name="school"
                  placeholder="School name"
                  className="input"
                  value={filters.school}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Batting Stats</h3>
              
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="label">Min Runs</label>
                  <input
                    type="number"
                    name="minRuns"
                    placeholder="Min"
                    className="input"
                    value={filters.minRuns}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="w-1/2">
                  <label className="label">Max Runs</label>
                  <input
                    type="number"
                    name="maxRuns"
                    placeholder="Max"
                    className="input"
                    value={filters.maxRuns}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="label">Min Batting Avg</label>
                  <input
                    type="number"
                    name="minBattingAvg"
                    placeholder="Min"
                    className="input"
                    value={filters.minBattingAvg}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="w-1/2">
                  <label className="label">Max Batting Avg</label>
                  <input
                    type="number"
                    name="maxBattingAvg"
                    placeholder="Max"
                    className="input"
                    value={filters.maxBattingAvg}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Bowling Stats</h3>
              
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="label">Min Wickets</label>
                  <input
                    type="number"
                    name="minWickets"
                    placeholder="Min"
                    className="input"
                    value={filters.minWickets}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="w-1/2">
                  <label className="label">Max Wickets</label>
                  <input
                    type="number"
                    name="maxWickets"
                    placeholder="Max"
                    className="input"
                    value={filters.maxWickets}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="label">Min Bowling Avg</label>
                  <input
                    type="number"
                    name="minBowlingAvg"
                    placeholder="Min"
                    className="input"
                    value={filters.minBowlingAvg}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="w-1/2">
                  <label className="label">Max Bowling Avg</label>
                  <input
                    type="number"
                    name="maxBowlingAvg"
                    placeholder="Max"
                    className="input"
                    value={filters.maxBowlingAvg}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3 flex justify-end">
              <button
                className="btn btn-outline mr-2"
                onClick={() => {
                  setFilters({
                    minAge: '',
                    maxAge: '',
                    region: '',
                    school: '',
                    minRuns: '',
                    maxRuns: '',
                    minWickets: '',
                    maxWickets: '',
                    minBattingAvg: '',
                    maxBattingAvg: '',
                    minBowlingAvg: '',
                    maxBowlingAvg: ''
                  });
                }}
              >
                Clear Filters
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSearch()}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 w-10 text-center">
                  <span className="sr-only">Compare</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('age')}
                >
                  <div className="flex items-center">
                    Age {getSortIcon('age')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School/District
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('runs')}
                >
                  <div className="flex items-center">
                    Runs {getSortIcon('runs')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('wickets')}
                >
                  <div className="flex items-center">
                    Wickets {getSortIcon('wickets')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('battingAvg')}
                >
                  <div className="flex items-center">
                    Bat Avg {getSortIcon('battingAvg')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('bowlingAvg')}
                >
                  <div className="flex items-center">
                    Bowl Avg {getSortIcon('bowlingAvg')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center">
                    <FaSpinner className="animate-spin text-primary text-xl inline-block" />
                    <span className="ml-2">Loading...</span>
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    No players found matching your criteria
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr 
                    key={player._id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => togglePlayerSelection(player._id)}
                        className={`w-6 h-6 rounded ${
                          selectedPlayers.includes(player._id)
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                        } flex items-center justify-center`}
                        title={selectedPlayers.includes(player._id) ? "Remove from comparison" : "Add to comparison"}
                      >
                        {selectedPlayers.includes(player._id) ? <FaCheck size={12} /> : <FaPlus size={12} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="relative h-10 w-10">
                          {player.profileImage ? (
                            <img
                              src={player.profileImage}
                              alt={player.name}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${
                              player.profileImage ? 'hidden' : ''
                            }`}
                          >
                            <span className="text-sm font-bold text-gray-500">
                              {player.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Link to={`/dashboard/coach/players/${player._id}`} className="hover:text-primary">
                            <h3 className="font-medium">{player.name}</h3>
                          </Link>
                          <p className="text-xs text-gray-500">
                            {player.school && `${player.school}`}
                            {player.school && player.district && ` • `}
                            {player.district && `${player.district}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.age || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {player.school || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {player.district || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.stats?.runs || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.stats?.wickets || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.stats?.battingAvg?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.stats?.bowlingAvg?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {player.rating ? (
                        <div className="flex items-center">
                          <FaStar className="text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{player.rating.overall}/10</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not rated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => toggleWatchlist(player._id, player.inWatchlist)}
                          className={`p-2 rounded-full ${player.inWatchlist ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-opacity-80`}
                          title={player.inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          {player.inWatchlist ? <FaEye /> : <FaEyeSlash />}
                        </button>
                        <Link
                          to={`/dashboard/coach/players/${player._id}`}
                          className="p-2 rounded-full bg-primary bg-opacity-10 text-primary hover:bg-opacity-20"
                          title="View player details"
                        >
                          <FaStar />
                        </Link>
                        <button
                          onClick={() => addToCompare(player._id)}
                          className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                          title="Compare this player"
                        >
                          <FaExchangeAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === pagination.pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{players.length}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNumber;
                    
                    // Logic to show pages around current page
                    if (pagination.pages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNumber = pagination.pages - 4 + i;
                    } else {
                      pageNumber = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNumber
                            ? 'z-10 bg-primary border-primary text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Selected players floating panel */}
      {selectedPlayers.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Selected for Comparison</h3>
            <span className="text-sm text-gray-500">{selectedPlayers.length}/{maxCompareCount}</span>
          </div>
          <div className="mb-3">
            {selectedPlayers.map(id => {
              const player = players.find(p => p._id === id);
              return player ? (
                <div key={id} className="flex items-center justify-between mb-1">
                  <span className="text-sm truncate max-w-xs">{player.name}</span>
                  <button 
                    onClick={() => togglePlayerSelection(id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : null;
            })}
          </div>
          <button 
            onClick={navigateToCompare}
            className="btn btn-primary w-full"
          >
            Compare Players
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerSearch; 