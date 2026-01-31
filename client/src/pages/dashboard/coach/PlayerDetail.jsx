import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSpinner, FaStar, FaEye, FaEyeSlash, FaArrowLeft, FaEdit, FaCheck, FaTimes, FaChartBar, FaComment, FaPaperPlane, FaRegStar } from 'react-icons/fa';
import { getPlayerDetails, ratePlayer, addToWatchlist, removeFromWatchlist, sendPlayerFeedback, getPlayerFeedbackHistory } from '../../../services/coachService';
import { toast } from 'react-toastify';

// Rating Stars Component
const RatingStars = ({ rating, maxRating = 5 }) => {
  // Convert rating from 1-10 scale to stars display (correctly)
  const normalizedRating = Math.ceil((rating / 10) * maxRating);
  
  return (
    <div className="flex items-center">
      {[...Array(maxRating)].map((_, i) => (
        <span key={i}>
          {i < normalizedRating ? (
            <FaStar className="text-yellow-500" />
          ) : (
            <FaRegStar className="text-gray-300" />
          )}
        </span>
      ))}
      <span className="ml-2 font-medium">{rating}/10</span>
    </div>
  );
};

const PlayerDetail = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Rating state
  const [isRating, setIsRating] = useState(false);
  const [rating, setRating] = useState({
    overall: 5,
    batting: 5,
    bowling: 5,
    fielding: 5,
    fitness: 5,
    tags: [],
    notes: ''
  });
  const [newTag, setNewTag] = useState('');
  const [savingRating, setSavingRating] = useState(false);
  
  // Watchlist state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [updatingWatchlist, setUpdatingWatchlist] = useState(false);

  // Feedback state
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Fetch player details
  useEffect(() => {
    const fetchPlayerDetails = async () => {
      if (!playerId) return;
      
      try {
        setLoading(true);
        console.log('Fetching player details for ID:', playerId);
        const data = await getPlayerDetails(playerId);
        console.log('Player details received:', data);
        setPlayer(data);
        
        // Initialize rating form if player has rating
        if (data.rating) {
          setRating({
            overall: data.rating.overall,
            batting: data.rating.batting,
            bowling: data.rating.bowling,
            fielding: data.rating.fielding,
            fitness: data.rating.fitness,
            tags: data.rating.tags || [],
            notes: data.rating.notes || ''
          });
        }
        
        // Set watchlist status
        setInWatchlist(data.inWatchlist);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching player details:', err);
        setError('Failed to load player details. Please try again.');
        toast.error('Failed to load player details');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerDetails();
  }, [playerId]);

  // Fetch feedback history
  useEffect(() => {
    const fetchFeedbackHistory = async () => {
      if (!playerId) return;
      
      try {
        setLoadingFeedback(true);
        const data = await getPlayerFeedbackHistory(playerId);
        setFeedbackHistory(data);
      } catch (err) {
        console.error('Error fetching feedback history:', err);
        toast.error('Failed to load feedback history');
      } finally {
        setLoadingFeedback(false);
      }
    };
    
    fetchFeedbackHistory();
  }, [playerId]);

  // Handle rating change
  const handleRatingChange = (e) => {
    const { name, value } = e.target;
    setRating(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  // Handle tag input
  const handleAddTag = () => {
    if (newTag.trim() && !rating.tags.includes(newTag.trim())) {
      setRating(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove) => {
    setRating(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle notes change
  const handleNotesChange = (e) => {
    setRating(prev => ({
      ...prev,
      notes: e.target.value
    }));
  };

  // Save rating
  const handleSaveRating = async () => {
    try {
      setSavingRating(true);
      
      await ratePlayer(playerId, rating);
      
      // Update player state with new rating
      setPlayer(prev => ({
        ...prev,
        rating: { ...rating }
      }));
      
      setIsRating(false);
      
    } catch (err) {
      console.error('Error saving rating:', err);
      alert('Failed to save rating. Please try again.');
    } finally {
      setSavingRating(false);
    }
  };

  // Toggle watchlist status
  const handleToggleWatchlist = async () => {
    try {
      setUpdatingWatchlist(true);
      
      if (inWatchlist) {
        await removeFromWatchlist(playerId);
      } else {
        await addToWatchlist(playerId);
      }
      
      setInWatchlist(!inWatchlist);
      
    } catch (err) {
      console.error('Error updating watchlist:', err);
      alert('Failed to update watchlist. Please try again.');
    } finally {
      setUpdatingWatchlist(false);
    }
  };

  // Send feedback to player
  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter feedback message');
      return;
    }
    
    try {
      setIsSendingFeedback(true);
      
      const response = await sendPlayerFeedback(playerId, {
        feedback: feedback.trim(),
        category: feedbackCategory
      });
      
      // Add to feedback history
      setFeedbackHistory(prev => [response, ...prev]);
      
      // Reset form
      setFeedback('');
      setFeedbackCategory('general');
      
      toast.success('Feedback sent successfully');
    } catch (err) {
      console.error('Error sending feedback:', err);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSendingFeedback(false);
    }
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
        <p className="text-gray-600">Loading player details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/coach/player-search')} 
          className="mt-2 text-primary hover:underline flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Search
        </button>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <p className="text-yellow-600">Player not found</p>
        <button 
          onClick={() => navigate('/dashboard/coach/player-search')} 
          className="mt-2 text-primary hover:underline flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center mb-4">
        <button 
          onClick={() => navigate('/dashboard/coach/player-search')} 
          className="text-primary hover:underline flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Search
        </button>
      </div>
      
      {/* Player header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="relative mb-4 md:mb-0 md:mr-6">
              {player.profileImage ? (
                <img
                  src={player.profileImage}
                  alt={player.name}
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary-light"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-primary-light ${
                  player.profileImage ? 'hidden' : ''
                }`}
              >
                <span className="text-2xl font-bold text-gray-500">
                  {player.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
              <div className="text-gray-600">
                {player.school && <span>{player.school}</span>}
                {player.school && player.district && <span> • </span>}
                {player.district && <span>{player.district}</span>}
              </div>
              {player.dateOfBirth && (
                <div className="text-sm text-gray-500">
                  Age: {calculateAge(player.dateOfBirth)} years
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleToggleWatchlist}
              disabled={updatingWatchlist}
              className={`btn ${inWatchlist ? 'btn-secondary' : 'btn-outline'} flex items-center`}
            >
              {updatingWatchlist ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : inWatchlist ? (
                <FaEyeSlash className="mr-2" />
              ) : (
                <FaEye className="mr-2" />
              )}
              {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
            
            <button
              onClick={() => setIsRating(!isRating)}
              className={`btn ${isRating ? 'btn-secondary' : 'btn-outline'} flex items-center`}
            >
              <FaStar className="mr-2" />
              {isRating ? 'Cancel Rating' : 'Rate Player'}
            </button>
          </div>
        </div>
      </div>

      {/* Player Profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card bg-white p-6 shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-full space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">School:</span>
                <span className="font-medium">{player?.school || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">District:</span>
                <span className="font-medium">{player?.district || 'N/A'}</span>
              </div>
              {player?.stats && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Matches:</span>
                    <span className="font-medium">{player.stats.matches || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Runs:</span>
                    <span className="font-medium">{player.stats.runs || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Wickets:</span>
                    <span className="font-medium">{player.stats.wickets || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Rating Card */}
        <div className="card bg-white p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Your Rating</h3>
            {!isRating && (
              <button
                onClick={() => setIsRating(true)}
                className="btn btn-sm btn-outline flex items-center"
              >
                <FaEdit className="mr-1" />
                {player?.rating ? 'Edit' : 'Rate Player'}
              </button>
            )}
          </div>
          
          {isRating ? (
            <div className="space-y-4">
              {/* Rating sliders */}
              <div className="space-y-3">
                <div>
                  <label className="flex justify-between text-sm mb-1">
                    <span>Overall Rating:</span>
                    <span className="font-medium">{rating.overall}/10</span>
                  </label>
                  <input
                    type="range"
                    name="overall"
                    min="1"
                    max="10"
                    value={rating.overall}
                    onChange={handleRatingChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="flex justify-between text-sm mb-1">
                    <span>Batting:</span>
                    <span className="font-medium">{rating.batting}/10</span>
                  </label>
                  <input
                    type="range"
                    name="batting"
                    min="1"
                    max="10"
                    value={rating.batting}
                    onChange={handleRatingChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="flex justify-between text-sm mb-1">
                    <span>Bowling:</span>
                    <span className="font-medium">{rating.bowling}/10</span>
                  </label>
                  <input
                    type="range"
                    name="bowling"
                    min="1"
                    max="10"
                    value={rating.bowling}
                    onChange={handleRatingChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="flex justify-between text-sm mb-1">
                    <span>Fielding:</span>
                    <span className="font-medium">{rating.fielding}/10</span>
                  </label>
                  <input
                    type="range"
                    name="fielding"
                    min="1"
                    max="10"
                    value={rating.fielding}
                    onChange={handleRatingChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="flex justify-between text-sm mb-1">
                    <span>Fitness:</span>
                    <span className="font-medium">{rating.fitness}/10</span>
                  </label>
                  <input
                    type="range"
                    name="fitness"
                    min="1"
                    max="10"
                    value={rating.fitness}
                    onChange={handleRatingChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {rating.tags.map((tag, index) => (
                    <div 
                      key={index} 
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center"
                    >
                      {tag}
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-800 hover:text-blue-900"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag (e.g. 'High Potential')"
                    className="input text-sm flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button
                    onClick={handleAddTag}
                    className="btn btn-sm btn-primary ml-2"
                    disabled={!newTag.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={rating.notes}
                  onChange={handleNotesChange}
                  placeholder="Add your notes about this player..."
                  className="input text-sm w-full h-24"
                ></textarea>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsRating(false)}
                  className="btn btn-sm btn-outline"
                  disabled={savingRating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRating}
                  className="btn btn-sm btn-primary flex items-center"
                  disabled={savingRating}
                >
                  {savingRating ? (
                    <>
                      <FaSpinner className="animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-1" />
                      Save Rating
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : player?.rating ? (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="inline-flex items-center bg-blue-100 text-blue-800 text-lg font-semibold px-4 py-2 rounded">
                  <RatingStars rating={player.rating.overall} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Batting</div>
                  <div className="flex justify-center mt-1">
                    <RatingStars rating={player.rating.batting} maxRating={3} />
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Bowling</div>
                  <div className="flex justify-center mt-1">
                    <RatingStars rating={player.rating.bowling} maxRating={3} />
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Fielding</div>
                  <div className="flex justify-center mt-1">
                    <RatingStars rating={player.rating.fielding} maxRating={3} />
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Fitness</div>
                  <div className="flex justify-center mt-1">
                    <RatingStars rating={player.rating.fitness} maxRating={3} />
                  </div>
                </div>
              </div>
              
              {player.rating.tags && player.rating.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {player.rating.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {player.rating.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {player.rating.notes}
                  </p>
                </div>
              )}
              
              <div className="text-xs text-gray-400 text-right">
                Last updated: {player.rating.lastUpdated ? new Date(player.rating.lastUpdated).toLocaleString() : 'Recently'}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaStar className="mx-auto text-3xl mb-2 text-gray-300" />
              <p>You haven't rated this player yet</p>
              <button
                onClick={() => setIsRating(true)}
                className="btn btn-primary mt-4"
              >
                Rate Now
              </button>
            </div>
          )}
        </div>
        
        {/* Performance Stats */}
        <div className="card bg-white p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">Performance Stats</h3>
          
          {player?.recentStats && player.recentStats.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h4 className="text-sm text-blue-700 font-medium">Batting</h4>
                  <div className="text-2xl font-bold text-blue-900">{player.stats?.battingAvg?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-blue-600">Average</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <h4 className="text-sm text-green-700 font-medium">Bowling</h4>
                  <div className="text-2xl font-bold text-green-900">{player.stats?.bowlingAvg?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-green-600">Average</p>
                </div>
              </div>
              
              <h4 className="text-sm font-medium text-gray-700 mt-2">Recent Matches</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {player.recentStats.map((stat, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-medium">vs {stat.match.opponent}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(stat.match.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Batting: </span>
                        <span className="font-medium">{stat.batting.runs} runs</span>
                        <span className="text-gray-500"> ({stat.batting.balls} balls)</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bowling: </span>
                        <span className="font-medium">{stat.bowling.wickets}-{stat.bowling.runs}</span>
                        <span className="text-gray-500"> ({stat.bowling.overs} overs)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent match data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="card bg-white p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaComment className="mr-2 text-primary" />
          Send Feedback to Player
        </h3>
        
        <div className="space-y-4">
          {/* Feedback form */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Category
              </label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="input text-sm w-full"
              >
                <option value="general">General</option>
                <option value="batting">Batting</option>
                <option value="bowling">Bowling</option>
                <option value="fielding">Fielding</option>
                <option value="fitness">Fitness</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Feedback Message
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback for the player..."
                className="input text-sm w-full h-24"
                maxLength={500}
              ></textarea>
              <div className="text-xs text-gray-500 text-right mt-1">
                {feedback.length}/500 characters
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSendFeedback}
                disabled={isSendingFeedback || !feedback.trim()}
                className="btn btn-primary flex items-center"
              >
                {isSendingFeedback ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Feedback history */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Previous Feedback
            </h4>
            
            {loadingFeedback ? (
              <div className="flex justify-center py-4">
                <FaSpinner className="animate-spin text-primary" />
              </div>
            ) : feedbackHistory.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {feedbackHistory.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          item.category === 'batting' ? 'bg-blue-500' :
                          item.category === 'bowling' ? 'bg-green-500' :
                          item.category === 'fielding' ? 'bg-yellow-500' :
                          item.category === 'fitness' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></span>
                        <span className="text-sm font-medium capitalize">{item.category}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {item.feedback}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No previous feedback</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

export default PlayerDetail; 