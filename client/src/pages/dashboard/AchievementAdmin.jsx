import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaBolt, FaStar, FaChartBar, FaRegCalendarAlt, FaUserEdit, FaCertificate, FaAward, FaUser, FaSchool, FaMapMarkerAlt, FaClock, FaFlag } from 'react-icons/fa';
import { GiCricketBat, GiLaurelsTrophy } from 'react-icons/gi';
import { getPendingAchievements, reviewAchievement } from '../../services/achievementService';

const AchievementAdmin = () => {
  const [pendingAchievements, setPendingAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewStatus, setReviewStatus] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock token (will come from auth context in real app)
  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbklkIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2NDU3NjQwLCJleHAiOjE2MTY0NjEyNDB9.Yvv6A-s7VnbjC-LpM9yrRQ";

  useEffect(() => {
    fetchPendingAchievements();
  }, [filterCategory]);

  const fetchPendingAchievements = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingAchievements(mockToken);
      
      // Apply category filter if needed
      const filteredData = filterCategory === 'all' 
        ? data 
        : data.filter(item => item.category === filterCategory);
      
      setPendingAchievements(filteredData);
    } catch (error) {
      console.error('Failed to fetch pending achievements', error);
      // Mock data for testing
      setPendingAchievements(mockPendingAchievements);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (achievementId) => {
    setReviewStatus(prev => ({
      ...prev,
      [achievementId]: { loading: true }
    }));
    
    try {
      const response = await reviewAchievement(
        achievementId, 
        { status: 'approved' }, 
        mockToken
      );
      
      setReviewStatus(prev => ({
        ...prev,
        [achievementId]: { success: true, message: response.message }
      }));
      
      // Remove from pending list after a delay
      setTimeout(() => {
        setPendingAchievements(prev => 
          prev.filter(item => item._id !== achievementId)
        );
        
        setReviewStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[achievementId];
          return newStatus;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error approving achievement:', error);
      setReviewStatus(prev => ({
        ...prev,
        [achievementId]: { 
          error: true, 
          message: error.response?.data?.message || 'Failed to approve achievement' 
        }
      }));
    }
  };

  const handleReject = async (achievementId, feedback = '') => {
    setReviewStatus(prev => ({
      ...prev,
      [achievementId]: { loading: true }
    }));
    
    try {
      const response = await reviewAchievement(
        achievementId, 
        { 
          status: 'rejected',
          feedback
        }, 
        mockToken
      );
      
      setReviewStatus(prev => ({
        ...prev,
        [achievementId]: { success: true, message: response.message }
      }));
      
      // Remove from pending list after a delay
      setTimeout(() => {
        setPendingAchievements(prev => 
          prev.filter(item => item._id !== achievementId)
        );
        
        setReviewStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[achievementId];
          return newStatus;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error rejecting achievement:', error);
      setReviewStatus(prev => ({
        ...prev,
        [achievementId]: { 
          error: true, 
          message: error.response?.data?.message || 'Failed to reject achievement' 
        }
      }));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHr / 24);
    
    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minutes ago`;
    } else if (diffHr < 24) {
      return `${diffHr} hours ago`;
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Batting':
        return <FaBolt className="text-secondary h-5 w-5" />;
      case 'Bowling':
        return <GiCricketBat className="text-primary h-5 w-5" />;
      case 'Fielding':
        return <FaAward className="text-green-500 h-5 w-5" />;
      case 'All-Round':
        return <FaStar className="text-yellow-500 h-5 w-5" />;
      case 'Team':
        return <FaUserEdit className="text-purple-500 h-5 w-5" />;
      case 'Career':
        return <FaCertificate className="text-blue-500 h-5 w-5" />;
      case 'Special':
        return <GiLaurelsTrophy className="text-amber-500 h-5 w-5" />;
      default:
        return null;
    }
  };

  // Get tier badge color
  const getTierColor = (tier) => {
    switch (tier) {
      case 'Bronze':
        return 'bg-amber-700 text-white';
      case 'Silver':
        return 'bg-gray-400 text-white';
      case 'Gold':
        return 'bg-yellow-500 text-white';
      case 'Platinum':
        return 'bg-blue-600 text-white';
      case 'Diamond':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  // Mock pending achievements for testing
  const mockPendingAchievements = [
    {
      _id: '1',
      title: 'Double Century',
      description: 'Scored 204 runs against Nalanda College',
      category: 'Batting',
      achievementDate: '2024-03-20',
      submittedBy: {
        _id: 'user1',
        name: 'Sanath Jayasuriya',
        role: 'player'
      },
      submissionNotes: 'This is my highest score ever. I have attached the scorecard for verification.',
      player: {
        _id: 'player1',
        name: 'Sanath Jayasuriya',
        school: 'St. Servatius College',
        district: 'Matara'
      },
      opponent: 'Nalanda College',
      venue: 'SSC Ground, Colombo',
      value: 204,
      tier: 'Gold',
      status: 'pending',
      createdAt: '2024-03-21T08:30:00Z'
    },
    {
      _id: '2',
      title: 'Five Wicket Haul',
      description: 'Took 5 wickets for 25 runs against Ananda College',
      category: 'Bowling',
      achievementDate: '2024-03-18',
      submittedBy: {
        _id: 'user2',
        name: 'Lasith Malinga',
        role: 'player'
      },
      player: {
        _id: 'player2',
        name: 'Lasith Malinga',
        school: 'Mahinda College',
        district: 'Galle'
      },
      opponent: 'Ananda College',
      venue: 'Galle International Stadium',
      value: 5,
      tier: 'Silver',
      status: 'pending',
      createdAt: '2024-03-19T14:15:00Z'
    },
    {
      _id: '3',
      title: 'Safe Hands',
      description: 'Took 4 catches in a single match against Royal College',
      category: 'Fielding',
      achievementDate: '2024-03-15',
      submittedBy: {
        _id: 'user3',
        name: 'Kumar Sangakkara',
        role: 'player'
      },
      player: {
        _id: 'player3',
        name: 'Kumar Sangakkara',
        school: 'Trinity College',
        district: 'Kandy'
      },
      opponent: 'Royal College',
      venue: 'Asgiriya Stadium, Kandy',
      value: 4,
      tier: 'Silver',
      status: 'pending',
      createdAt: '2024-03-16T09:45:00Z'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Achievement Review</h1>
      <p className="text-gray-600 mb-6">Review and approve/reject player-submitted achievements</p>
      
      {/* Filter by category */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCategory === 'all' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setFilterCategory('all')}
          >
            All
          </button>
          {['Batting', 'Bowling', 'Fielding', 'All-Round', 'Team', 'Career', 'Special'].map(cat => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center transition-colors ${
                filterCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              onClick={() => setFilterCategory(cat)}
            >
              {getCategoryIcon(cat)}
              <span className="ml-1">{cat}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Pending achievements list */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-500">Loading pending achievements...</p>
        </div>
      ) : pendingAchievements.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <FaFlag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No pending achievements</h3>
          <p className="text-gray-500 text-sm">All achievements have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingAchievements.map(achievement => (
            <div 
              key={achievement._id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              {/* Review status indicator */}
              {reviewStatus[achievement._id]?.loading && (
                <div className="p-3 bg-blue-50 text-blue-700 text-center">
                  <div className="spinner inline-block mr-2 h-4 w-4 border-2"></div>
                  Processing review...
                </div>
              )}
              
              {reviewStatus[achievement._id]?.success && (
                <div className="p-3 bg-green-50 text-green-700 text-center">
                  <FaCheckCircle className="inline-block mr-2" />
                  {reviewStatus[achievement._id].message}
                </div>
              )}
              
              {reviewStatus[achievement._id]?.error && (
                <div className="p-3 bg-red-50 text-red-700 text-center">
                  <FaTimesCircle className="inline-block mr-2" />
                  {reviewStatus[achievement._id].message}
                </div>
              )}
              
              {/* Achievement header */}
              <div className="p-4 flex justify-between items-start border-b bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTierColor(achievement.tier)}`}>
                      {achievement.tier}
                    </span>
                    <span className="bg-primary-light text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                      {getCategoryIcon(achievement.category)}
                      {achievement.category}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                      <FaClock className="h-3 w-3" />
                      Pending
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mt-1">{achievement.title}</h3>
                </div>
                <div className="text-xs text-gray-500">
                  Submitted {formatTimeAgo(achievement.createdAt)}
                </div>
              </div>
              
              {/* Achievement details */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left column - Player info */}
                  <div className="md:col-span-1 space-y-3">
                    <div className="flex items-center mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold mr-3">
                        {achievement.player.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium">{achievement.player.name}</h4>
                        <p className="text-xs text-gray-500">
                          Submitted by: {achievement.submittedBy.name} ({achievement.submittedBy.role})
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FaSchool className="text-gray-400" />
                        <span>{achievement.player.school}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span>{achievement.player.district}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaRegCalendarAlt className="text-gray-400" />
                        <span>{formatDate(achievement.achievementDate)}</span>
                      </div>
                      {achievement.opponent && (
                        <div>vs. {achievement.opponent}</div>
                      )}
                      {achievement.venue && (
                        <div>{achievement.venue}</div>
                      )}
                      {achievement.value && (
                        <div className="flex items-center gap-2">
                          <FaChartBar className="text-primary" />
                          <span className="font-medium">{achievement.value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Middle column - Achievement description */}
                  <div className="md:col-span-2">
                    <div className="mb-4">
                      <h4 className="text-sm text-gray-500 mb-1">Achievement Description</h4>
                      <p className="bg-gray-50 p-3 rounded">{achievement.description}</p>
                    </div>
                    
                    {achievement.submissionNotes && (
                      <div>
                        <h4 className="text-sm text-gray-500 mb-1">Additional Notes from Player</h4>
                        <p className="bg-gray-50 p-3 rounded border border-gray-200 italic text-gray-600">
                          "{achievement.submissionNotes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Review actions */}
              {!reviewStatus[achievement._id]?.loading && 
               !reviewStatus[achievement._id]?.success && 
               !reviewStatus[achievement._id]?.error && (
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                  <button
                    className="btn bg-white border border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => handleReject(achievement._id)}
                    disabled={!!reviewStatus[achievement._id]}
                  >
                    <FaTimesCircle className="mr-2" />
                    Reject
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApprove(achievement._id)}
                    disabled={!!reviewStatus[achievement._id]}
                  >
                    <FaCheckCircle className="mr-2" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementAdmin; 