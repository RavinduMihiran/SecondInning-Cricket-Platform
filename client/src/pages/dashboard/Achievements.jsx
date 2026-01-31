import { useState, useEffect, useContext } from 'react';
import {
  FaAward,
  FaBolt,
  FaCertificate,
  FaChartBar,
  FaFilter,
  FaHistory,
  FaMedal,
  FaRegCalendarAlt,
  FaSearch,
  FaStar,
  FaTrophy,
  FaUserEdit,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaCrown,
  FaGem,
  FaShieldAlt,
  FaChessKing,
  FaRibbon,
  FaUsers,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { GiCricketBat, GiLaurelsTrophy, GiTrophyCup, GiPodium, GiLaurels, GiMedal, GiStarMedal } from 'react-icons/gi';
import { BiMedal, BiTrophy } from 'react-icons/bi';
import { getPlayerAchievements, getPlayerAchievementStats, getRecentAchievements, submitAchievement } from '../../services/achievementService';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [achievementStats, setAchievementStats] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Batting',
    achievementDate: new Date().toISOString().split('T')[0],
    opponent: '',
    venue: '',
    value: '',
    tier: 'Bronze',
    submissionNotes: ''
  });

  // Get user from AuthContext
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!user || (!user.id && !user._id)) {
          setError('User information not available. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        const userId = user.id || user._id;
        console.log(`Fetching achievements for user ID: ${userId}`);
        
        // Get achievements based on active tab and filters
        let category = null;
        if (filterCategory !== 'all') {
          category = filterCategory;
        } else if (activeTab !== 'all' && activeTab !== 'recent') {
          category = activeTab;
        }

        // Get player's achievements
        try {
        const achievementsData = await getPlayerAchievements(
            userId,
          category,
          filterTier !== 'all' ? filterTier : null
        );
          console.log('Achievements data received:', achievementsData);

        // Filter by search query if needed
        let filteredAchievements = achievementsData;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredAchievements = achievementsData.filter(a => 
            a.title.toLowerCase().includes(query) || 
            a.description.toLowerCase().includes(query) ||
            (a.opponent && a.opponent.toLowerCase().includes(query))
          );
        }

        setAchievements(filteredAchievements);
        } catch (achievementError) {
          console.error('Failed to fetch achievements', achievementError);
          setAchievements([]);
          toast.error('Failed to load achievements list');
        }

        // Get achievements stats
        try {
          const statsData = await getPlayerAchievementStats(userId);
          console.log('Achievement stats received:', statsData);
        setAchievementStats(statsData);
        } catch (statsError) {
          console.error('Failed to fetch achievement stats', statsError);
          setAchievementStats(null);
          toast.error(statsError.message || 'Failed to load achievement statistics');
        }

        // Get recent achievements (for recent tab)
        if (activeTab === 'recent') {
          try {
          const recentData = await getRecentAchievements(5);
          setRecentAchievements(recentData);
          } catch (recentError) {
            console.error('Failed to fetch recent achievements', recentError);
            setRecentAchievements([]);
            toast.error('Failed to load recent achievements');
          }
        }
      } catch (error) {
        console.error('Failed to fetch achievement data', error);
        setError('Failed to load achievements. Please try again later.');
        toast.error('Failed to load achievements');
        
        // Initialize with empty data instead of mock data
        setAchievements([]);
        setAchievementStats(null);
        setRecentAchievements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, activeTab, searchQuery, filterCategory, filterTier]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle achievement submission
  const handleSubmitAchievement = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ loading: true });
    
    try {
      if (!user || (!user.id && !user._id)) {
        throw new Error('User information not available. Please log in again.');
      }
      
      const userId = user.id || user._id;
      
      const achievementData = {
        ...formData,
        player: userId,
        value: formData.value ? Number(formData.value) : null
      };
      
      const response = await submitAchievement(achievementData);
      
      setSubmissionStatus({ success: true, message: response.message || 'Achievement submitted successfully!' });
      
      // Reset form data
      setFormData({
        title: '',
        description: '',
        category: 'Batting',
        achievementDate: new Date().toISOString().split('T')[0],
        opponent: '',
        venue: '',
        value: '',
        tier: 'Bronze',
        submissionNotes: ''
      });
      
      // Refresh achievements after submission
      const refreshedData = await getPlayerAchievements(userId);
      setAchievements(refreshedData);
      
      const refreshedStats = await getPlayerAchievementStats(userId);
      setAchievementStats(refreshedStats);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmissionStatus(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting achievement:', error);
      
      setSubmissionStatus({ 
        error: true, 
        message: error.response?.data?.message || error.message || 'Failed to submit achievement. Please try again.' 
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get icon based on category
  const getAchievementIcon = (category) => {
    switch (category) {
      case 'Batting':
        return <GiCricketBat className="text-secondary h-6 w-6" />;
      case 'Bowling':
        return <GiCricketBat className="text-primary h-6 w-6 transform rotate-180" />;
      case 'Fielding':
        return <FaShieldAlt className="text-green-500 h-5 w-5" />;
      case 'All-Round':
        return <GiStarMedal className="text-yellow-500 h-6 w-6" />;
      case 'Team':
        return <FaUsers className="text-purple-500 h-5 w-5" />;
      case 'Career':
        return <GiPodium className="text-blue-500 h-6 w-6" />;
      case 'Special':
        return <GiLaurels className="text-amber-500 h-6 w-6" />;
      default:
        return <FaTrophy className="text-primary-light h-5 w-5" />;
    }
  };

  // Get tier styles
  const getTierStyles = (tier) => {
    switch (tier) {
      case 'Bronze':
        return 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md';
      case 'Silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-300 text-white shadow-md';
      case 'Gold':
        return 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white shadow-md';
      case 'Platinum':
        return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md';
      case 'Diamond':
        return 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md';
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    // Re-fetch data
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!user || (!user.id && !user._id)) {
          setError('User information not available. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        const userId = user.id || user._id;
        
        // Get achievements based on active tab and filters
        let category = null;
        if (filterCategory !== 'all') {
          category = filterCategory;
        } else if (activeTab !== 'all' && activeTab !== 'recent') {
          category = activeTab;
        }

        // Get player's achievements
        try {
          const achievementsData = await getPlayerAchievements(
            userId,
            category,
            filterTier !== 'all' ? filterTier : null
          );

          // Filter by search query if needed
          let filteredAchievements = achievementsData;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredAchievements = achievementsData.filter(a => 
              a.title.toLowerCase().includes(query) || 
              a.description.toLowerCase().includes(query) ||
              (a.opponent && a.opponent.toLowerCase().includes(query))
            );
          }

          setAchievements(filteredAchievements);
          toast.success('Achievements refreshed');
        } catch (achievementError) {
          console.error('Failed to fetch achievements', achievementError);
          setAchievements([]);
          toast.error('Failed to refresh achievements list');
        }

        // Get achievements stats
        try {
          const statsData = await getPlayerAchievementStats(userId);
          setAchievementStats(statsData);
        } catch (statsError) {
          console.error('Failed to fetch achievement stats', statsError);
          setAchievementStats(null);
          toast.error(statsError.message || 'Failed to refresh achievement statistics');
        }

        // Get recent achievements (for recent tab)
        if (activeTab === 'recent') {
          try {
            const recentData = await getRecentAchievements(5);
            setRecentAchievements(recentData);
          } catch (recentError) {
            console.error('Failed to fetch recent achievements', recentError);
            setRecentAchievements([]);
            toast.error('Failed to load recent achievements');
          }
        }
      } catch (error) {
        console.error('Failed to refresh achievement data', error);
        setError('Failed to refresh achievements. Please try again.');
        toast.error('Failed to refresh achievements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Achievements</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            title="Refresh Achievements"
            disabled={isLoading}
          >
            <FaSync className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FaPlus /> Submit New Achievement
          </button>
                    </div>
                    </div>
                    
      {/* Achievement Stats Summary */}
      {!isLoading && !error && (
        <div className="bg-gradient-to-br from-primary via-primary-dark to-blue-900 text-white p-6 rounded-xl shadow-lg mb-8 relative overflow-hidden">
          {/* Trophy background decoration */}
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <GiTrophyCup className="w-64 h-64" />
                    </div>
                    
          {achievementStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
              <div className="text-center flex flex-col items-center">
                <div className="relative mb-2">
                  <GiTrophyCup className="text-yellow-300 h-12 w-12 mb-2" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold">{achievementStats.total || 0}</span>
                    </div>
                  </div>
                <div className="text-sm font-medium text-blue-100">Total Achievements</div>
                  </div>
                  
              <div className="flex flex-wrap justify-center gap-3">
                {achievementStats.byTier && achievementStats.byTier.length > 0 ? (
                  achievementStats.byTier.map(tier => (
                    <div key={tier._id} className="text-center bg-white/20 py-2 px-4 rounded-lg backdrop-blur-sm flex flex-col items-center">
                      {tier._id === 'Bronze' && <BiMedal className="text-amber-600 h-6 w-6" />}
                      {tier._id === 'Silver' && <BiMedal className="text-gray-300 h-6 w-6" />}
                      {tier._id === 'Gold' && <BiMedal className="text-yellow-400 h-6 w-6" />}
                      {tier._id === 'Platinum' && <FaCrown className="text-blue-300 h-5 w-5" />}
                      {tier._id === 'Diamond' && <FaGem className="text-purple-300 h-5 w-5" />}
                      <div className="text-xl font-bold">{tier.count}</div>
                      <div className="text-xs font-medium">{tier._id}</div>
                  </div>
                  ))
                ) : (
                  <div className="text-center">
                    <div className="text-sm">No achievements yet</div>
                  </div>
              )}
          </div>
              
              {achievementStats.latest ? (
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm relative">
                  <div className="absolute -right-2 -top-2">
                    <FaRibbon className="text-red-400 h-8 w-8" />
            </div>
                  <div className="text-xs uppercase tracking-wide text-blue-100 font-semibold mb-1">Latest Achievement</div>
                  <div className="font-medium text-lg flex items-center gap-2">
                    {getAchievementIcon(achievementStats.latest.category)}
                    {achievementStats.latest.title}
                  </div>
                  <div className="text-xs text-blue-100 mt-1 flex items-center gap-1">
                    <FaRegCalendarAlt />
                    {formatDate(achievementStats.latest.achievementDate)}
                </div>
            </div>
              ) : (
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-wide text-blue-100 font-semibold">Latest Achievement</div>
                  <div className="font-medium flex items-center gap-2">
                    <FaTrophy className="text-gray-300" />
                    None yet
                  </div>
              </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 relative z-10">
              <div className="flex justify-center mb-2">
                <FaTrophy className="text-yellow-300 h-10 w-10 opacity-50" />
          </div>
              <p className="text-blue-100 mb-2">Achievement statistics unavailable</p>
              <button 
                onClick={handleRefresh}
                className="mt-2 bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-md text-sm flex items-center gap-2 mx-auto"
              >
                <FaSync /> Refresh Stats
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters and Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex overflow-x-auto">
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'all' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'Batting' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('Batting')}
          >
            Batting
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'Bowling' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('Bowling')}
          >
            Bowling
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'Fielding' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('Fielding')}
          >
            Fielding
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'recent' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('recent')}
          >
              <FaHistory className="inline mr-2" />
            Recent
          </button>
        </div>

          <div className="flex items-center gap-4">
          <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 pr-4 py-2 w-full md:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
                className="select select-sm border-gray-300"
            >
              <option value="all">All Tiers</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <GiTrophyCup className="text-primary text-6xl opacity-20" />
            <FaSpinner className="animate-spin text-primary text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
          <p className="text-gray-600 mt-4">Loading achievements...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 p-8 rounded-lg text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <FaTrophy className="text-red-200 text-5xl absolute" />
            <FaTimes className="text-red-500 text-3xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-medium text-red-800 mb-2">Failed to Load Achievements</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={handleRefresh}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && achievements.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <GiTrophyCup className="text-9xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center">
              <div className="relative">
                <GiTrophyCup className="h-16 w-16 text-gray-300" />
                <FaPlus className="absolute bottom-0 right-0 text-primary bg-white rounded-full p-1 text-lg shadow-md" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-2 mt-4">No achievements yet</h3>
            <p className="text-gray-500 mb-6">Start playing matches and recording your stats to earn achievements!</p>
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="btn btn-primary flex items-center gap-2 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <FaPlus />
              Submit Achievement
            </button>
          </div>
        </div>
      )}

      {/* Achievements List */}
      {!isLoading && !error && achievements.length > 0 && (
        <div className="space-y-6">
          {achievements.map(achievement => (
            <div key={achievement._id} className="p-6 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 bg-white relative overflow-hidden group">
              {/* Background decoration based on tier */}
              <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                {achievement.tier === 'Bronze' && <BiMedal className="h-40 w-40" />}
                {achievement.tier === 'Silver' && <BiMedal className="h-40 w-40" />}
                {achievement.tier === 'Gold' && <BiMedal className="h-40 w-40" />}
                {achievement.tier === 'Platinum' && <FaCrown className="h-40 w-40" />}
                {achievement.tier === 'Diamond' && <FaGem className="h-40 w-40" />}
              </div>
              
              <div className="flex items-start gap-5 relative z-10">
                <div className={`p-4 rounded-lg text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300 ${
                  achievement.category === 'Batting' ? 'bg-gradient-to-br from-secondary to-secondary-dark' :
                  achievement.category === 'Bowling' ? 'bg-gradient-to-br from-primary to-primary-dark' :
                  achievement.category === 'Fielding' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  achievement.category === 'All-Round' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                  achievement.category === 'Team' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                  achievement.category === 'Career' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  achievement.category === 'Special' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                  'bg-gradient-to-br from-primary-light to-primary'
                }`}>
                    {getAchievementIcon(achievement.category)}
                  </div>
                  
                  <div className="flex-1">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <h4 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">{achievement.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${getTierStyles(achievement.tier)}`}>
                        {achievement.tier === 'Bronze' && <BiMedal className="h-3 w-3" />}
                        {achievement.tier === 'Silver' && <BiMedal className="h-3 w-3" />}
                        {achievement.tier === 'Gold' && <BiMedal className="h-3 w-3" />}
                        {achievement.tier === 'Platinum' && <FaCrown className="h-3 w-3" />}
                        {achievement.tier === 'Diamond' && <FaGem className="h-3 w-3" />}
                        {achievement.tier}
                      </span>
                    </div>
                      </div>
                    
                  <p className="mt-2 text-gray-700">{achievement.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1">
                        <FaRegCalendarAlt className="text-gray-400" />
                        <span>{formatDate(achievement.achievementDate)}</span>
                      </div>
                      
                      {achievement.opponent && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">vs.</span>
                        <span>{achievement.opponent}</span>
                      </div>
                      )}
                      
                      {achievement.venue && (
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span>{achievement.venue}</span>
                      </div>
                      )}
                    
                    {achievement.value && (
                      <div className="flex items-center gap-1">
                        <FaChartBar className="text-gray-400" />
                        <span>{achievement.value}</span>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Achievement Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Submit New Achievement</h2>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitAchievement} className="p-4">
              {submissionStatus?.loading && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-md mb-4 flex items-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Submitting your achievement...
            </div>
              )}
              
              {submissionStatus?.success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 flex items-center">
                  <FaCheckCircle className="mr-2" />
                  {submissionStatus.message}
                </div>
              )}
              
              {submissionStatus?.error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 flex items-center">
                  <FaTimesCircle className="mr-2" />
                  {submissionStatus.message}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Achievement title"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input w-full h-24"
                  placeholder="Describe your achievement"
                  required
                />
                </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  >
                    <option value="Batting">Batting</option>
                    <option value="Bowling">Bowling</option>
                    <option value="Fielding">Fielding</option>
                    <option value="All-Round">All-Round</option>
                    <option value="Team">Team</option>
                    <option value="Career">Career</option>
                    <option value="Special">Special</option>
                  </select>
          </div>

              <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="achievementDate"
                    value={formData.achievementDate}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>
                </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Opponent
                  </label>
                  <input
                    type="text"
                    name="opponent"
                    value={formData.opponent}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="Opponent team"
                  />
                </div>

              <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="Match venue"
                  />
            </div>
          </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Value (if applicable)
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="e.g., runs scored"
                  />
                </div>

              <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Tier
                  </label>
                  <select
                    name="tier"
                    value={formData.tier}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>
                </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Submission Notes
                </label>
                <textarea
                  name="submissionNotes"
                  value={formData.submissionNotes}
                  onChange={handleInputChange}
                  className="input w-full h-24"
                  placeholder="Additional notes for verification"
                />
          </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn btn-outline mr-2"
                  disabled={submissionStatus?.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submissionStatus?.loading}
                >
                  {submissionStatus?.loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : 'Submit Achievement'}
                </button>
            </div>
            </form>
                </div>
                </div>
      )}
    </div>
  );
};

export default Achievements; 