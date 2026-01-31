import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaListAlt, FaUserPlus, FaChartBar, FaDownload, FaSpinner, FaUser, FaStar, FaEye } from 'react-icons/fa';
import { AuthContext } from '../../../contexts/AuthContext';
import { getCoachDashboardData } from '../../../services/coachService';

const CoachDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Get the user role from AuthContext
  const userRole = user?.role || 'coach';
  const isScout = userRole === 'scout';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getCoachDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading dashboard data...</p>
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
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">{isScout ? 'Scout' : 'Coach'} Dashboard</h1>
      </div>

      {/* Coach/Scout Profile Card */}
      <div className="card p-6 bg-white shadow-md">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {dashboardData?.coach?.profileImage ? (
              <img 
                src={dashboardData.coach.profileImage} 
                alt={dashboardData.coach.name} 
                className="h-20 w-20 rounded-full object-cover border-2 border-primary-light"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center ${dashboardData?.coach?.profileImage ? 'hidden' : ''}`}
            >
              <span className="text-xl font-bold text-gray-500">
                {getInitials(dashboardData?.coach?.name || (isScout ? 'Scout' : 'Coach'))}
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">{dashboardData?.coach?.name}</h2>
            <p className="text-gray-600">{dashboardData?.coach?.position || (isScout ? 'Scout' : 'Coach')}</p>
            <p className="text-gray-600">{dashboardData?.coach?.organization || 'Organization'}</p>
          </div>
          <div className="ml-auto">
            <Link 
              to="/dashboard/coach/settings" 
              className="btn btn-outline text-sm"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link 
          to="/dashboard/coach/player-search" 
          className="card bg-white p-6 text-center hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <FaSearch className="mx-auto h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-gray-800">Player Search</h3>
          <p className="text-sm text-gray-600 mt-2">Find and filter players</p>
        </Link>
        
        <Link 
          to="/dashboard/coach/watchlist" 
          className="card bg-white p-6 text-center hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <FaListAlt className="mx-auto h-8 w-8 text-secondary mb-3" />
          <h3 className="font-semibold text-gray-800">Watchlist</h3>
          <p className="text-sm text-gray-600 mt-2">
            {dashboardData?.stats?.watchlistCount || 0} players
          </p>
        </Link>
        
        <Link 
          to="/dashboard/coach/compare-players" 
          className="card bg-white p-6 text-center hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <FaChartBar className="mx-auto h-8 w-8 text-accent mb-3" />
          <h3 className="font-semibold text-gray-800">Compare Players</h3>
          <p className="text-sm text-gray-600 mt-2">Side-by-side comparison</p>
        </Link>
        
        <Link 
          to="/dashboard/coach/export" 
          className="card bg-white p-6 text-center hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <FaDownload className="mx-auto h-8 w-8 text-success mb-3" />
          <h3 className="font-semibold text-gray-800">Export Data</h3>
          <p className="text-sm text-gray-600 mt-2">Generate reports</p>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Ratings */}
        <div className="card bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Recent Ratings</h2>
            <Link to="/dashboard/coach/ratings" className="text-primary text-xs flex items-center hover:underline">
              View All ({dashboardData?.stats?.ratingsCount || 0})
            </Link>
          </div>
          
          {dashboardData?.recentRatings?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentRatings.map((rating) => (
                <Link 
                  key={rating.id} 
                  to={`/dashboard/coach/players/${rating.player.id}`}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="relative h-10 w-10 mr-3">
                    {rating.player.profileImage ? (
                      <img 
                        src={rating.player.profileImage} 
                        alt={rating.player.name} 
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${rating.player.profileImage ? 'hidden' : ''}`}
                    >
                      <span className="text-sm font-bold text-gray-500">
                        {getInitials(rating.player.name)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{rating.player.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(rating.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <FaStar className="text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{rating.overall}/10</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center">
              <p className="text-gray-500 mb-5 text-sm">No ratings yet</p>
              <Link 
                to="/dashboard/coach/player-search" 
                className="btn btn-primary text-sm empty-state-button"
              >
                Rate Players
              </Link>
            </div>
          )}
        </div>
        
        {/* Recent Watchlist */}
        <div className="card bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Watchlist</h2>
            <Link to="/dashboard/coach/watchlist" className="text-primary text-xs flex items-center hover:underline">
              View All ({dashboardData?.stats?.watchlistCount || 0})
            </Link>
          </div>
          
          {dashboardData?.recentWatchlist?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentWatchlist.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/dashboard/coach/players/${item.player.id}`}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="relative h-10 w-10 mr-3">
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
                      className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${item.player.profileImage ? 'hidden' : ''}`}
                    >
                      <span className="text-sm font-bold text-gray-500">
                        {getInitials(item.player.name)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{item.player.name}</h3>
                    <p className="text-xs text-gray-500">
                      {item.player.school || item.player.district || 'Player'}
                    </p>
                  </div>
                  <FaEye className="text-gray-400" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center">
              <p className="text-gray-500 mb-5 text-sm">No players in watchlist</p>
              <Link 
                to="/dashboard/coach/player-search" 
                className="btn btn-primary text-sm empty-state-button"
              >
                Add Players
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard; 