import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaUserTie, FaStar, FaEnvelope, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import networkService from '../../services/networkService';

const Network = () => {
  const [activeTab, setActiveTab] = useState('coaches');
  const [searchQuery, setSearchQuery] = useState('');
  const [district, setDistrict] = useState('All Districts');
  const [coaches, setCoaches] = useState([]);
  const [scouts, setScouts] = useState([]);
  const [districts, setDistricts] = useState(['All Districts']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch districts for filter dropdown
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const districtData = await networkService.getDistricts();
        setDistricts(['All Districts', ...districtData]);
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    };

    fetchDistricts();
  }, []);

  // Fetch coaches or scouts based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const filters = {
          search: searchQuery,
          district: district !== 'All Districts' ? district : undefined
        };
        
        if (activeTab === 'coaches') {
          const coachData = await networkService.getCoaches(filters);
          setCoaches(coachData);
        } else {
          const scoutData = await networkService.getScouts(filters);
          setScouts(scoutData);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, searchQuery, district]);

  // Handle favorite coach toggle
  const handleToggleFavorite = async (coachId) => {
    try {
      const response = await networkService.toggleFavoriteCoach(coachId);
      
      // Update coaches state with new favorite status
      setCoaches(coaches.map(coach => 
        coach._id === coachId 
          ? { ...coach, isFavorite: response.isFavorite } 
          : coach
      ));
    } catch (err) {
      console.error('Error toggling favorite status:', err);
    }
  };

  // Handle scout connection request
  const handleRequestConnection = async (scoutId) => {
    try {
      const response = await networkService.requestScoutConnection(scoutId);
      
      // Update scouts state with new pending status
      setScouts(scouts.map(scout => 
        scout._id === scoutId 
          ? { ...scout, isPending: response.isPending } 
          : scout
      ));
    } catch (err) {
      console.error('Error requesting connection:', err);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cricket Network</h1>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select 
            className="input py-2"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            {districts.map((dist, index) => (
              <option key={index} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex overflow-x-auto space-x-4">
          <button
            className={`pb-2 px-1 font-medium border-b-2 ${
              activeTab === 'coaches' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('coaches')}
          >
            Coaches
          </button>
          <button
            className={`pb-2 px-1 font-medium border-b-2 ${
              activeTab === 'scouts' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('scouts')}
          >
            Scouts
          </button>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-primary h-8 w-8" />
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {/* Coaches Tab */}
      {!loading && !error && activeTab === 'coaches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.length > 0 ? (
            coaches.map(coach => (
              <div key={coach._id} className="card bg-white p-6 flex items-center">
                {coach.profileImage ? (
                  <img 
                    src={coach.profileImage} 
                    alt={coach.name} 
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-white text-xl font-bold mr-4">
                    {getInitials(coach.name)}
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{coach.name}</h3>
                      <p className="text-sm text-gray-500">{coach.position || coach.role}</p>
                      <p className="text-sm text-gray-500">{coach.district}</p>
                      {coach.organization && (
                        <p className="text-sm text-gray-500">{coach.organization}</p>
                      )}
                    </div>
                    <button 
                      className="text-yellow-500 hover:text-yellow-600"
                      onClick={() => handleToggleFavorite(coach._id)}
                    >
                      <FaStar className={coach.isFavorite ? 'text-yellow-500' : 'text-gray-300'} />
                    </button>
                  </div>
                  <div className="mt-2">
                    <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                      <FaEnvelope className="mr-1" /> Message
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FaUserTie className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No coaches found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery || district !== 'All Districts' ? 'Try different search criteria' : 'No coaches available in your area'}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Scouts Tab */}
      {!loading && !error && activeTab === 'scouts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scouts.length > 0 ? (
            scouts.map(scout => (
              <div key={scout._id} className="card bg-white p-6 flex items-center">
                {scout.profileImage ? (
                  <img 
                    src={scout.profileImage} 
                    alt={scout.name} 
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-secondary-light flex items-center justify-center text-white text-xl font-bold mr-4">
                    {getInitials(scout.name)}
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{scout.name}</h3>
                      <p className="text-sm text-gray-500">{scout.organization || 'Scout'}</p>
                      <p className="text-sm text-gray-500">{scout.district}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    {scout.isConnected ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <FaCheck className="mr-1" /> Connected
                      </div>
                    ) : scout.isPending ? (
                      <div className="flex items-center text-yellow-600 text-sm">
                        <FaSpinner className="mr-1" /> Request Pending
                      </div>
                    ) : (
                      <button 
                        className="px-3 py-1 text-sm border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                        onClick={() => handleRequestConnection(scout._id)}
                      >
                        Request Connection
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FaUserTie className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No scouts found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery || district !== 'All Districts' ? 'Try different search criteria' : 'No scouts available in your area'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Network; 