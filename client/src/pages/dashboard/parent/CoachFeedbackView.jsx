import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaSpinner, FaComment, FaArrowLeft, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import { getCoachFeedback, getChildDetails } from '../../../services/parentService';

const CoachFeedbackView = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [childDetails, setChildDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId) {
        setError('No player ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch player details
        const details = await getChildDetails(playerId);
        if (!details || !details.player) {
          throw new Error('Could not load player details');
        }
        setChildDetails(details);
        
        // Fetch coach feedback
        const feedbackData = await getCoachFeedback(playerId);
        setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching coach feedback:', err);
        setError('Failed to load feedback. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle back button
  const handleBack = () => {
    try {
      navigate(`/dashboard/parent/child/${playerId}`);
    } catch (err) {
      console.error('Navigation error:', err);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-600">Loading coach feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex items-center mb-3">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <p className="text-red-600 font-medium">Error</p>
        </div>
        <p className="text-red-600 mb-3">{error}</p>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try again
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!childDetails || !childDetails.player) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="flex items-center mb-3">
          <FaExclamationTriangle className="text-yellow-500 mr-2" />
          <p className="text-yellow-700 font-medium">Player Not Found</p>
        </div>
        <p className="text-yellow-600 mb-3">Could not load player details. Please go back and try again.</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center mb-4">
        <button
          onClick={handleBack}
          className="text-primary hover:underline flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Child Profile
        </button>
      </div>
      
      {/* Child Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
        <div className="relative mr-4">
          {childDetails.player.profileImage ? (
            <img
              src={childDetails.player.profileImage}
              alt={childDetails.player.name}
              className="h-16 w-16 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-500">
                {getInitials(childDetails.player.name || '')}
              </span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">{childDetails.player.name || 'Player'}</h1>
          <p className="text-gray-600 text-sm">
            {childDetails.player.school && `${childDetails.player.school}`}
            {childDetails.player.school && childDetails.player.district && ` • `}
            {childDetails.player.district && `${childDetails.player.district}`}
          </p>
        </div>
      </div>
      
      {/* Coach Feedback */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaComment className="mr-2 text-blue-500" /> Coach Feedback
        </h2>
        
        {feedback && feedback.length > 0 ? (
          <div className="space-y-6">
            {feedback.map((item) => (
              <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  {item.coach?.profileImage ? (
                    <img
                      src={item.coach.profileImage}
                      alt={item.coach?.name || 'Coach'}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-gray-500">
                        {getInitials(item.coach?.name || 'Coach')}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{item.coach?.name || 'Coach'}</div>
                    <div className="text-xs text-gray-500">{item.coach?.role || 'Coach'}</div>
                  </div>
                  <div className="ml-auto text-xs text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${item.category === 'batting' ? 'bg-blue-100 text-blue-800' : 
                      item.category === 'bowling' ? 'bg-green-100 text-green-800' : 
                      item.category === 'fielding' ? 'bg-yellow-100 text-yellow-800' : 
                      item.category === 'fitness' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }
                  `}>
                    {item.category || 'General'}
                  </span>
                  
                  {item.rating && (
                    <div className="ml-3 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-gray-700 whitespace-pre-wrap">
                  {item.feedback || 'No feedback provided'}
                </div>
                
                {item.areas && item.areas.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700">Areas to Improve:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.areas.map((area, index) => (
                        <span 
                          key={index} 
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {item.strengths && item.strengths.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700">Strengths:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.strengths.map((strength, index) => (
                        <span 
                          key={index} 
                          className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-3xl mb-2" />
            <p>No coach feedback available yet</p>
            <button 
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Return to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachFeedbackView; 