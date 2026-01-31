import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaSpinner, FaChartLine, FaComment, FaPlus, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import { AuthContext } from '../../../contexts/AuthContext';
import { getParentDashboardData } from '../../../services/parentService';

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getParentDashboardData();
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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
        <h1 className="text-xl font-bold text-gray-800">Parent Dashboard</h1>
      </div>

      {/* Parent Profile Card */}
      <div className="card p-6 bg-white shadow-md">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.name} 
                className="h-20 w-20 rounded-full object-cover border-2 border-primary-light"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-500">
                  {getInitials(user?.name || 'Parent')}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-gray-600">Parent</p>
          </div>
          <div className="ml-auto">
            <Link 
              to="/dashboard/parent/settings" 
              className="btn btn-outline text-sm"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Children Section */}
      <div className="card bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">My Children</h2>
          <Link to="/dashboard/parent/link-child" className="text-primary text-xs flex items-center hover:underline">
            <FaPlus className="mr-1" /> Add Child
          </Link>
        </div>
        
        {dashboardData?.children?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.children.map((child) => (
              <Link 
                key={child._id} 
                to={`/dashboard/parent/child/${child._id}`}
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="relative h-14 w-14 mr-3">
                  {child.profileImage ? (
                    <img 
                      src={child.profileImage} 
                      alt={child.name} 
                      className="h-14 w-14 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-500">
                        {getInitials(child.name)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{child.name}</h3>
                  <p className="text-xs text-gray-500">
                    {child.school && `${child.school}`}
                    {child.school && child.district && ` • `}
                    {child.district && `${child.district}`}
                  </p>
                </div>
                <FaArrowRight className="text-gray-400" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-3xl mb-2" />
            <p className="text-gray-500">You haven't linked any children yet</p>
            <Link 
              to="/dashboard/parent/link-child" 
              className="btn btn-primary mt-4 inline-block"
            >
              Link Child
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      {dashboardData?.children?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Stats */}
          <div className="card bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Recent Match Stats</h2>
            </div>
            
            {dashboardData?.recentStats?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentStats.map((stat) => (
                  <Link 
                    key={stat._id} 
                    to={`/dashboard/parent/child/${stat.player?._id}`}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="relative h-10 w-10 mr-3">
                      {stat.player?.profileImage ? (
                        <img 
                          src={stat.player.profileImage} 
                          alt={stat.player?.name || 'Player'} 
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-500">
                            {getInitials(stat.player?.name || 'Player')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{stat.player?.name || 'Player'}</h3>
                      <p className="text-xs text-gray-500">
                        {stat.match?.opponent && `vs ${stat.match.opponent}`} • {stat.match?.date ? new Date(stat.match.date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded mr-1">
                        {stat.batting?.runs || 0}/{stat.batting?.balls || 0}
                      </div>
                      <div className="text-xs font-medium bg-green-50 text-green-600 px-2 py-1 rounded">
                        {stat.bowling?.wickets || 0}/{stat.bowling?.runs || 0}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent stats</p>
              </div>
            )}
          </div>
          
          {/* Recent Feedback */}
          <div className="card bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Recent Coach Feedback</h2>
            </div>
            
            {dashboardData?.recentFeedback?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentFeedback.map((feedback) => (
                  <Link 
                    key={feedback._id} 
                    to={`/dashboard/parent/child/${feedback.player?._id}/feedback`}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="relative h-10 w-10 mr-3">
                      {feedback.player?.profileImage ? (
                        <img 
                          src={feedback.player.profileImage} 
                          alt={feedback.player?.name || 'Player'} 
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-500">
                            {getInitials(feedback.player?.name || 'Player')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{feedback.player?.name || 'Player'}</h3>
                      <p className="text-xs text-gray-500">
                        From: {feedback.coach?.name || 'Coach'} • {feedback.createdAt ? formatDate(feedback.createdAt) : 'No date'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className={`text-xs font-medium px-2 py-1 rounded capitalize
                        ${feedback.category === 'batting' ? 'bg-blue-50 text-blue-600' : 
                          feedback.category === 'bowling' ? 'bg-green-50 text-green-600' : 
                          feedback.category === 'fielding' ? 'bg-yellow-50 text-yellow-600' : 
                          feedback.category === 'fitness' ? 'bg-red-50 text-red-600' : 
                          'bg-gray-50 text-gray-600'
                        }
                      `}>
                        {feedback.category || 'General'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent feedback</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard; 