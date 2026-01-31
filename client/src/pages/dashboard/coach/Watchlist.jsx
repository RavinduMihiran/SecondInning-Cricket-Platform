import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner, FaUser, FaTrash, FaStar, FaDownload, FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import axios from 'axios';

const Watchlist = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('addedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [removingId, setRemovingId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch watchlist data
  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/coaches/watchlist');
      setWatchlist(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError('Failed to load watchlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle removing player from watchlist
  const handleRemoveFromWatchlist = async (playerId) => {
    try {
      setRemovingId(playerId);
      await axios.delete(`/api/coaches/watchlist/remove/${playerId}`);
      
      // Update local state
      setWatchlist(watchlist.filter(item => item.player._id !== playerId));
    } catch (err) {
      console.error('Error removing player from watchlist:', err);
      alert('Failed to remove player from watchlist. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  // Handle export watchlist
  const handleExportWatchlist = async () => {
    try {
      setExportLoading(true);
      
      const response = await axios.get('/api/coaches/export/watchlist');
      
      // Create a downloadable file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlist_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error exporting watchlist:', err);
      alert('Failed to export watchlist. Please try again.');
    } finally {
      setExportLoading(false);
    }
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

  // Filter and sort watchlist
  const filteredWatchlist = watchlist
    .filter(item => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      const player = item.player;
      
      return (
        player.name.toLowerCase().includes(query) ||
        (player.school && player.school.toLowerCase().includes(query)) ||
        (player.district && player.district.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = a.player.name.toLowerCase();
          valueB = b.player.name.toLowerCase();
          break;
        case 'age':
          valueA = a.player.age || 0;
          valueB = b.player.age || 0;
          break;
        case 'runs':
          valueA = a.player.stats?.runs || 0;
          valueB = b.player.stats?.runs || 0;
          break;
        case 'wickets':
          valueA = a.player.stats?.wickets || 0;
          valueB = b.player.stats?.wickets || 0;
          break;
        case 'battingAvg':
          valueA = a.player.stats?.battingAvg || 0;
          valueB = b.player.stats?.battingAvg || 0;
          break;
        case 'bowlingAvg':
          valueA = a.player.stats?.bowlingAvg || 0;
          valueB = b.player.stats?.bowlingAvg || 0;
          break;
        case 'addedAt':
        default:
          valueA = new Date(a.addedAt).getTime();
          valueB = new Date(b.addedAt).getTime();
      }
      
      const compareResult = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading watchlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Watchlist</h1>
        <button
          onClick={handleExportWatchlist}
          disabled={exportLoading || watchlist.length === 0}
          className="btn btn-primary flex items-center"
        >
          {exportLoading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaDownload className="mr-2" />
          )}
          Export Watchlist
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchWatchlist} 
            className="mt-2 text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search watchlist by name, school, or district..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('name')}
                >
                  <div className="flex items-center">
                    Player {getSortIcon('name')}
                  </div>
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
                  onClick={() => handleSortChange('addedAt')}
                >
                  <div className="flex items-center">
                    Added {getSortIcon('addedAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWatchlist.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    {watchlist.length === 0 ? (
                      <div className="py-8 flex flex-col items-center">
                        <p className="mb-5 text-sm">Your watchlist is empty.</p>
                        <Link 
                          to="/dashboard/coach/player-search" 
                          className="btn btn-primary text-sm empty-state-button"
                        >
                          Find Players
                        </Link>
                      </div>
                    ) : (
                      'No players match your search'
                    )}
                  </td>
                </tr>
              ) : (
                filteredWatchlist.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10">
                          {item.player.profileImage ? (
                            <img 
                              src={item.player.profileImage} 
                              alt={item.player.name} 
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${
                              item.player.profileImage ? 'hidden' : ''
                            }`}
                          >
                            <span className="text-sm font-bold text-gray-500">
                              {item.player.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link 
                            to={`/dashboard/coach/players/${item.player._id}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary"
                          >
                            {item.player.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.player.age || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {item.player.school || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.player.district || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.player.stats?.runs || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.player.stats?.wickets || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.addedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="truncate">
                        {item.notes || <span className="text-gray-400">No notes</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/dashboard/coach/players/${item.player._id}`}
                          className="p-2 rounded-full bg-primary bg-opacity-10 text-primary hover:bg-opacity-20"
                          title="View player details"
                        >
                          <FaStar />
                        </Link>
                        <button
                          onClick={() => handleRemoveFromWatchlist(item.player._id)}
                          disabled={removingId === item.player._id}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                          title="Remove from watchlist"
                        >
                          {removingId === item.player._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Watchlist; 