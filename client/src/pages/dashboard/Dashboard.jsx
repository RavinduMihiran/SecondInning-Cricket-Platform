import { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaUser, 
  FaChartLine, 
  FaVideo, 
  FaUserFriends, 
  FaCog, 
  FaSignOutAlt,
  FaBars, 
  FaTimes,
  FaSearch,
  FaTrophy,
  FaPlus,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaBullhorn
} from 'react-icons/fa';
import cricketLogo from '../../assets/images/cricketlogo.png';
import { AuthContext } from '../../contexts/AuthContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import StatsRecordModal from '../../components/StatsRecordModal';

// Dashboard Sub-pages
import DashboardHome from './DashboardHome';
import PlayerProfile from './PlayerProfile';
import Statistics from './Statistics';
import MediaLibrary from './MediaLibrary';
import Network from './Network';
import Settings from './Settings';
import PlayerStatEntry from './PlayerStatEntry';
import Achievements from './Achievements';
import AchievementAdmin from './AchievementAdmin';
import Announcements from './Announcements';

// Coach Dashboard Components
import CoachDashboard from './coach/CoachDashboard';
import PlayerSearch from './coach/PlayerSearch';
import PlayerDetail from './coach/PlayerDetail';
import ComparePlayer from './coach/ComparePlayer';
import Watchlist from './coach/Watchlist';
import ExportData from './coach/ExportData';

// Import parent dashboard components
import ParentDashboard from './parent/ParentDashboard';
import ChildProfile from './parent/ChildProfile';
import ChildStats from './parent/ChildStats';
import CoachFeedbackView from './parent/CoachFeedbackView';
import MatchTimeline from './parent/MatchTimeline';
import LinkChild from './parent/LinkChild';
import ParentSettings from './parent/ParentSettings';
import ChildMediaLibrary from './parent/ChildMediaLibrary';

// Wrapper component for StatsRecordModal
const StatsRecordPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/dashboard');
  };
  
  const handleStatsAdded = (updatedStats) => {
    // Navigate to statistics page after adding stats
    navigate('/dashboard/statistics');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <StatsRecordModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        onStatsAdded={handleStatsAdded}
      />
      <div className="text-center mt-8">
        <h2 className="text-xl font-semibold mb-2">Record Your Match Statistics</h2>
        <p className="text-gray-600">
          Use the form to record your cricket performance statistics.
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { unreadCount, markAllAsRead } = useContext(NotificationContext);

  // User data derived from AuthContext
  const userData = {
    name: user?.name || 'User',
    role: user?.role || 'player',
    profileImage: user?.profileImage || null,
    school: user?.school || '',
    district: user?.district || ''
  };
  
  // Function to get display role name
  const getDisplayRole = (role) => {
    // Capitalize first letter of role
    if (!role) return 'Player';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Check authentication on mount
  useEffect(() => {
    // If not authenticated, redirect to login immediately
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setPageLoaded(true);
  }, [navigate, isAuthenticated]);

  // Base navigation items for all users
  const baseNavItems = [
    { name: 'Dashboard', icon: FaHome, path: '/dashboard' },
    { name: 'My Profile', icon: FaUser, path: '/dashboard/profile' },
    { name: 'Statistics', icon: FaChartLine, path: '/dashboard/statistics' },
    { name: 'Add Stats', icon: FaPlus, path: '/dashboard/add-stats' },
    { name: 'Achievements', icon: FaTrophy, path: '/dashboard/achievements' },
    { name: 'Media Library', icon: FaVideo, path: '/dashboard/media' },
    { name: 'Network', icon: FaUserFriends, path: '/dashboard/network' },
    { 
      name: 'Announcements', 
      icon: FaBullhorn, 
      path: '/dashboard/announcements',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { name: 'Settings', icon: FaCog, path: '/dashboard/settings' },
  ];
  
  // Coach/Scout navigation items
  const coachNavItems = [
    { name: 'Dashboard', icon: FaHome, path: '/dashboard' },
    { name: 'Player Search', icon: FaSearch, path: '/dashboard/coach/player-search' },
    { name: 'Watchlist', icon: FaUserFriends, path: '/dashboard/coach/watchlist' },
    { name: 'Compare Players', icon: FaChartLine, path: '/dashboard/coach/compare-players' },
    { name: 'Export Data', icon: FaPlus, path: '/dashboard/coach/export' },
    { 
      name: 'Announcements', 
      icon: FaBullhorn, 
      path: '/dashboard/announcements',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { name: 'Settings', icon: FaCog, path: '/dashboard/coach/settings' },
  ];
  
  // Admin-specific navigation items
  const adminNavItems = [
    { name: 'Review Achievements', icon: FaClipboardCheck, path: '/dashboard/achievement-admin' },
    // Add more admin-specific navigation items as needed
  ];
  
  // Parent navigation items
  const parentNavItems = [
    { name: 'Dashboard', icon: FaHome, path: '/dashboard' },
    { name: 'My Children', icon: FaUser, path: '/dashboard/parent/children' },
    { name: 'Link Child', icon: FaPlus, path: '/dashboard/parent/link-child' },
    { 
      name: 'Announcements', 
      icon: FaBullhorn, 
      path: '/dashboard/announcements',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { name: 'Settings', icon: FaCog, path: '/dashboard/parent/settings' },
  ];
  
  // Combine navigation items based on user role
  let navigationItems = baseNavItems;
  
  if (userData.role === 'admin') {
    navigationItems = [...baseNavItems, ...adminNavItems];
  } else if (userData.role === 'coach' || userData.role === 'scout') {
    navigationItems = coachNavItems;
  } else if (userData.role === 'parent') {
    navigationItems = parentNavItems;
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    // Use the AuthContext logout function
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-lg">
          <FaExclamationTriangle className="mx-auto text-5xl text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">
            Your session has expired or is invalid. You will be redirected to the login page.
          </p>
          <button
            onClick={handleLogout}
            className="btn btn-primary w-full"
          >
            Login Again
          </button>
        </div>
      </div>
    );
  }

  if (!pageLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner"></div>
        <p className="ml-3 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-background text-gray-800 ${pageLoaded ? 'fade-in' : 'opacity-0'}`}>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-20 p-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-md bg-primary text-white shadow-blue"
          aria-label="Open menu"
        >
          <FaBars className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          ></div>
          <div className="fixed inset-y-0 left-0 flex flex-col w-full max-w-xs bg-gradient-to-b from-primary to-primary-dark text-white shadow-xl transform transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 h-16">
              <div className="flex items-center">
                <img src={cricketLogo} alt="SecondInning Logo" className="h-8 w-auto mr-2" />
                <span className="text-lg font-bold">SecondInning</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-white hover:bg-primary-dark/50"
                aria-label="Close menu"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col items-center justify-center p-4 mb-6 bg-primary-dark/30 rounded-lg">
                {userData.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt={userData.name} 
                    className="h-16 w-16 rounded-full mb-3 object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-xl font-bold mb-3 shadow-md border-2 border-white">
                    {getInitials(userData.name)}
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-base font-semibold">{userData.name}</h3>
                  <p className="text-blue-200 text-xs capitalize">{getDisplayRole(userData.role)}</p>
                  {userData.role === 'player' && userData.school && (
                    <p className="text-blue-200 text-xs mt-1">{userData.school}, {userData.district}</p>
                  )}
                </div>
              </div>
              <nav className="space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`
                      group flex items-center py-2 px-3 rounded-md text-sm font-medium transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-primary-dark text-white shadow-blue' 
                        : 'text-blue-100 hover:bg-primary-dark/50 hover:text-white'
                      }
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={`mr-3 h-4 w-4 ${isActive(item.path) ? 'text-secondary-light' : ''}`} />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="p-4">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full py-2 px-4 rounded-md bg-secondary text-white hover:bg-secondary-dark transition-colors shadow-md"
              >
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div 
        className={`hidden lg:flex lg:flex-col fixed inset-y-0 bg-gradient-to-b from-primary to-primary-dark text-white shadow-lg transition-all duration-300 ease-in-out z-10 ${
          sidebarOpen ? 'w-60' : 'w-20'
        }`}
      >
        <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} p-4 h-16`}>
          {sidebarOpen ? (
            <div className="flex items-center">
              <img src={cricketLogo} alt="SecondInning Logo" className="h-8 w-auto mr-2" />
              <span className="text-lg font-bold">SecondInning</span>
            </div>
          ) : (
            <img src={cricketLogo} alt="SecondInning Logo" className="h-8 w-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md text-white hover:bg-primary-dark/50 transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FaBars className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-dark/50 scrollbar-track-transparent">
          <div className={`flex flex-col items-center justify-center p-4 mb-6 mx-3 bg-primary-dark/30 rounded-lg ${!sidebarOpen && 'mt-4'}`}>
            {userData.profileImage ? (
              <img 
                src={userData.profileImage} 
                alt={userData.name} 
                className={`${sidebarOpen ? 'h-16 w-16' : 'h-10 w-10'} rounded-full mb-3 object-cover border-2 border-white shadow-md transition-all duration-300`}
              />
            ) : (
              <div className={`${sidebarOpen ? 'h-16 w-16' : 'h-10 w-10'} rounded-full bg-secondary flex items-center justify-center text-lg font-bold mb-3 border-2 border-white shadow-md transition-all duration-300`}>
                {getInitials(userData.name)}
              </div>
            )}
            {sidebarOpen && (
              <div className="text-center">
                <h3 className="text-sm font-semibold">{userData.name}</h3>
                <p className="text-blue-200 text-xs capitalize">{getDisplayRole(userData.role)}</p>
                {userData.role === 'player' && userData.school && (
                  <p className="text-blue-200 text-xs mt-1">{userData.school}, {userData.district}</p>
                )}
              </div>
            )}
          </div>
          <nav className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  group flex items-center py-2 px-3 rounded-md text-sm font-medium transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-primary-dark text-white shadow-blue' 
                    : 'text-blue-100 hover:bg-primary-dark/50 hover:text-white'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className={`${sidebarOpen ? 'mr-3' : ''} h-4 w-4 ${isActive(item.path) ? 'text-secondary-light' : ''}`} />
                {sidebarOpen && (
                  <>
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && item.badge && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className={`
              flex items-center py-2 px-4 rounded-md bg-secondary text-white hover:bg-secondary-dark transition-colors shadow-md
              ${sidebarOpen ? 'justify-start w-full' : 'justify-center w-12 mx-auto'}
            `}
            title={!sidebarOpen ? "Logout" : undefined}
          >
            <FaSignOutAlt className={sidebarOpen ? 'mr-2 h-4 w-4' : 'h-4 w-4'} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-60' : 'lg:ml-20'
      }`}>
        {/* Topbar */}
        <header className="bg-white shadow-sm z-10 sticky top-0">
          <div className="flex justify-between items-center py-3 px-4 md:px-6">
            {/* Mobile Logo (visible on mobile only) */}
            <div className="flex items-center lg:hidden">
              <span className="text-lg font-bold text-primary ml-10 slide-right">SecondInning</span>
            </div>
            
            {/* Search and Actions */}
            <div className="flex-1 max-w-md ml-auto mr-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400 h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="input pl-9 py-1.5 text-sm rounded-full bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <NotificationDropdown />
              <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center text-white text-sm font-bold">
                {userData.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <Routes>
            {/* Default route based on user role */}
            <Route path="/" element={
              userData.role === 'coach' || userData.role === 'scout' 
                ? <CoachDashboard /> 
                : userData.role === 'parent'
                ? <ParentDashboard />
                : <DashboardHome />
            } />
            
            {/* Player routes */}
            <Route path="/profile" element={<PlayerProfile />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/add-stats" element={<StatsRecordPage />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/media" element={<MediaLibrary />} />
            <Route path="/network" element={<Network />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Admin routes */}
            {userData.role === 'admin' && (
              <Route path="/achievement-admin" element={<AchievementAdmin />} />
            )}
            
            {/* Coach/Scout routes */}
            {(userData.role === 'coach' || userData.role === 'scout') && (
              <>
                <Route path="/coach/settings" element={<Settings />} />
                <Route path="/coach/player-search" element={<PlayerSearch />} />
                <Route path="/coach/players/:playerId" element={<PlayerDetail />} />
                <Route path="/coach/compare-players" element={<ComparePlayer />} />
                <Route path="/coach/watchlist" element={<Watchlist />} />
                <Route path="/coach/export" element={<ExportData />} />
                <Route path="/coach/ratings" element={<Watchlist />} /> {/* Temporary redirect to watchlist */}
              </>
            )}
            
            {/* Parent routes */}
            {userData.role === 'parent' && (
              <>
                <Route path="/parent/children" element={<ChildProfile />} />
                <Route path="/parent/child/:playerId" element={<ChildProfile />} />
                <Route path="/parent/child/:playerId/stats" element={<ChildStats />} />
                <Route path="/parent/child/:playerId/feedback" element={<CoachFeedbackView />} />
                <Route path="/parent/child/:playerId/matches" element={<MatchTimeline />} />
                <Route path="/parent/link-child" element={<LinkChild />} />
                <Route path="/parent/settings" element={<ParentSettings />} />
                <Route path="/parent/child/:playerId/media" element={<ChildMediaLibrary />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 