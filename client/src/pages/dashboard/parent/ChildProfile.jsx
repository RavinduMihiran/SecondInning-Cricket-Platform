import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSpinner, FaStar, FaChartLine, FaHistory, FaComment, FaHeart, FaThumbsUp, FaSmile, FaArrowLeft, FaImage } from 'react-icons/fa';
import { getChildren, getChildDetails, createEngagement } from '../../../services/parentService';
import { toast } from 'react-toastify';

const ChildProfile = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childDetails, setChildDetails] = useState(null);
  const [error, setError] = useState(null);
  
  // For reactions
  const [sendingReaction, setSendingReaction] = useState(false);
  
  // Fetch children list
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await getChildren();
        setChildren(data);
        
        // If no playerId provided but we have children, select the first one
        if (!playerId && data.length > 0) {
          navigate(`/dashboard/parent/child/${data[0]._id}`);
        } else if (data.length === 0) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching children:', err);
        setError('Failed to load children list. Please try again.');
        setLoading(false);
      }
    };

    fetchChildren();
  }, [playerId, navigate]);
  
  // Fetch child details when playerId changes
  useEffect(() => {
    const fetchChildDetails = async () => {
      if (!playerId) return;
      
      try {
        setLoading(true);
        const data = await getChildDetails(playerId);
        setChildDetails(data);
        setSelectedChild(data.player);
        setError(null);
      } catch (err) {
        console.error('Error fetching child details:', err);
        setError('Failed to load child details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChildDetails();
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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Send reaction
  const handleSendReaction = async (reactionType) => {
    try {
      setSendingReaction(true);
      
      // Always use 'general' content type for reactions
      const contentType = 'general';
      
      console.log(`Creating engagement: ${reactionType} reaction with contentType=${contentType}`);
      
      // Create the engagement data
      const engagementData = {
        playerId,
        contentType,
        engagementType: 'reaction',
        reactionType
      };
      
      // Log the request being sent
      console.log('Sending engagement request with data:', engagementData);
      
      const response = await createEngagement(engagementData);
      
      console.log('Engagement created successfully:', response);
      
      // Show different messages based on reaction type
      let message = '';
      switch(reactionType) {
        case 'love':
          message = 'Sent love to your child!';
          break;
        case 'proud':
          message = 'Showed pride in your child!';
          break;
        case 'encouragement':
          message = 'Sent encouragement to your child!';
          break;
        default:
          message = `Sent ${reactionType} reaction!`;
      }
      
      toast.success(message);
    } catch (err) {
      console.error('Error sending reaction:', err);
      
      // Log more detailed error information
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        
        // Show specific error message based on status code
        if (err.response.status === 403) {
          toast.error('You don\'t have permission to send reactions to this player');
        } else if (err.response.status === 404) {
          toast.error('Could not find the content to react to');
        } else if (err.response.status === 429) {
          toast.error('Too many reactions sent. Please try again later');
        } else {
          const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Server error';
          toast.error(`Failed to send reaction: ${errorMessage}`);
        }
      } else if (err.request) {
        // Network error - the request was made but no response was received
        toast.error('Network error. Please check your connection and try again');
      } else {
        toast.error('Failed to send reaction. Please try again.');
      }
    } finally {
      setSendingReaction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading child profile...</p>
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

  if (children.length === 0) {
    return (
      <div className="bg-yellow-50 p-8 rounded-md text-center">
        <FaUser className="mx-auto text-yellow-500 text-4xl mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Children Linked</h2>
        <p className="text-gray-600 mb-4">
          You haven't linked any children to your account yet.
        </p>
        <Link 
          to="/dashboard/parent/link-child" 
          className="btn btn-primary"
        >
          Link Child
        </Link>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <p className="text-yellow-600">Please select a child to view their profile.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {children.map((child) => (
            <Link 
              key={child._id} 
              to={`/dashboard/parent/child/${child._id}`}
              className="flex items-center p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="relative h-12 w-12 mr-3">
                {child.profileImage ? (
                  <img 
                    src={child.profileImage} 
                    alt={child.name} 
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-500">
                      {getInitials(child.name)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{child.name}</h3>
                <p className="text-xs text-gray-500">
                  {child.school || 'No school'} • {child.district || 'No district'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center mb-4">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="text-primary hover:underline flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </button>
      </div>
      
      {/* Child selector (if multiple children) */}
      {children.length > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Child
          </label>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {children.map((child) => (
              <Link
                key={child._id}
                to={`/dashboard/parent/child/${child._id}`}
                className={`flex items-center p-2 rounded-md whitespace-nowrap ${
                  selectedChild._id === child._id 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="relative h-8 w-8 mr-2">
                  {child.profileImage ? (
                    <img 
                      src={child.profileImage} 
                      alt={child.name} 
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      selectedChild._id === child._id 
                        ? 'bg-white text-primary' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <span className="text-xs font-bold">
                        {getInitials(child.name)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{child.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Child Profile */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="relative mb-4 md:mb-0 md:mr-6">
              {selectedChild.profileImage ? (
                <img
                  src={selectedChild.profileImage}
                  alt={selectedChild.name}
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary-light"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-primary-light">
                  <span className="text-2xl font-bold text-gray-500">
                    {getInitials(selectedChild.name)}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-800">{selectedChild.name}</h1>
              <div className="text-gray-600">
                {selectedChild.school && <span>{selectedChild.school}</span>}
                {selectedChild.school && selectedChild.district && <span> • </span>}
                {selectedChild.district && <span>{selectedChild.district}</span>}
              </div>
              {selectedChild.dateOfBirth && (
                <div className="text-sm text-gray-500">
                  Age: {calculateAge(selectedChild.dateOfBirth)} years
                </div>
              )}
              <div className="text-sm text-primary mt-1">
                Relationship: {childDetails.relationship || 'Parent'}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSendReaction('love')}
              disabled={sendingReaction}
              className="btn btn-outline btn-sm flex items-center"
            >
              <FaHeart className="mr-1 text-red-500" />
              Love
            </button>
            <button
              onClick={() => handleSendReaction('proud')}
              disabled={sendingReaction}
              className="btn btn-outline btn-sm flex items-center"
            >
              <FaThumbsUp className="mr-1 text-blue-500" />
              Proud
            </button>
            <button
              onClick={() => handleSendReaction('encouragement')}
              disabled={sendingReaction}
              className="btn btn-outline btn-sm flex items-center"
            >
              <FaSmile className="mr-1 text-yellow-500" />
              Encourage
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to={`/dashboard/parent/child/${selectedChild._id}/stats`}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <FaChartLine className="mx-auto h-8 w-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-gray-800">Performance Stats</h3>
          <p className="text-sm text-gray-600 mt-2">View match statistics and performance history</p>
        </Link>
        
        <Link 
          to={`/dashboard/parent/child/${selectedChild._id}/feedback`}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <FaComment className="mx-auto h-8 w-8 text-green-500 mb-3" />
          <h3 className="font-semibold text-gray-800">Coach Feedback</h3>
          <p className="text-sm text-gray-600 mt-2">View feedback from coaches and scouts</p>
        </Link>
        
        <Link 
          to={`/dashboard/parent/child/${selectedChild._id}/matches`}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <FaHistory className="mx-auto h-8 w-8 text-purple-500 mb-3" />
          <h3 className="font-semibold text-gray-800">Match Timeline</h3>
          <p className="text-sm text-gray-600 mt-2">View match history chronologically</p>
        </Link>
      </div>

      {/* Navigation Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to={`/dashboard/parent/child/${selectedChild._id}/media`}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <FaImage className="mx-auto h-8 w-8 text-orange-500 mb-3" />
          <h3 className="font-semibold text-gray-800">Media Library</h3>
          <p className="text-sm text-gray-600 mt-2">View photos, videos and documents uploaded by your child</p>
        </Link>
      </div>

      {/* Recent Stats Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Performance</h2>
        
        {childDetails?.stats?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-blue-700 font-medium">Batting</h3>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {selectedChild.stats?.battingAvg?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-blue-600 mt-1">Average</p>
              
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-sm font-bold">{selectedChild.stats?.runs || 0}</div>
                  <div className="text-xs text-blue-600">Runs</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {childDetails.stats[0]?.batting.fours || 0}/
                    {childDetails.stats[0]?.batting.sixes || 0}
                  </div>
                  <div className="text-xs text-blue-600">4s/6s</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {childDetails.stats[0]?.batting.runs || 0}
                    ({childDetails.stats[0]?.batting.balls || 0})
                  </div>
                  <div className="text-xs text-blue-600">Last Match</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-green-700 font-medium">Bowling</h3>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {selectedChild.stats?.bowlingAvg?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-green-600 mt-1">Average</p>
              
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-sm font-bold">{selectedChild.stats?.wickets || 0}</div>
                  <div className="text-xs text-green-600">Wickets</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {(childDetails.stats[0]?.bowling.runs / (childDetails.stats[0]?.bowling.overs || 1)).toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-green-600">Economy</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">
                    {childDetails.stats[0]?.bowling.wickets || 0}/
                    {childDetails.stats[0]?.bowling.runs || 0}
                  </div>
                  <div className="text-xs text-green-600">Last Match</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No performance data available yet
          </div>
        )}
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Coach Feedback</h2>
          {selectedChild && (
            <Link 
              to={`/dashboard/parent/child/${selectedChild._id}/feedback`}
              className="text-primary text-sm hover:underline flex items-center"
              onClick={(e) => {
                // Prevent default if there's no valid ID
                if (!selectedChild._id) {
                  e.preventDefault();
                  console.error('No valid player ID for feedback view');
                  toast.error('Cannot view feedback: Invalid player ID');
                }
              }}
            >
              <FaComment className="mr-1" /> View All
            </Link>
          )}
        </div>
        
        {childDetails?.feedback?.length > 0 ? (
          <div className="space-y-4">
            {childDetails.feedback.slice(0, 3).map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      item.category === 'batting' ? 'bg-blue-500' :
                      item.category === 'bowling' ? 'bg-green-500' :
                      item.category === 'fielding' ? 'bg-yellow-500' :
                      item.category === 'fitness' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></span>
                    <span className="text-sm font-medium capitalize">{item.category || 'General'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {item.feedback}
                </p>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <FaUser className="mr-1" /> 
                  {item.coach?.name || 'Coach'} ({item.coach?.role || 'Coach'})
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No coach feedback available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildProfile; 