import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLink, FaSpinner, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { linkPlayer } from '../../../services/parentService';
import { toast } from 'react-toastify';

const LinkChild = () => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [relationship, setRelationship] = useState('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [linkedPlayer, setLinkedPlayer] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await linkPlayer(accessCode, relationship);
      
      setSuccess(true);
      setLinkedPlayer(response.player);
      toast.success('Successfully linked to player!');
    } catch (err) {
      console.error('Error linking player:', err);
      setError(err.response?.data?.message || 'Failed to link player. Please check the access code and try again.');
      toast.error('Failed to link player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="text-primary hover:underline flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold text-center mb-6">Link to Your Child</h1>
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-50 p-4 rounded-md mb-4">
              <FaCheck className="text-green-500 text-4xl mx-auto mb-2" />
              <h2 className="text-lg font-medium text-green-800">Successfully Linked!</h2>
              <p className="text-green-600 mb-2">
                You are now linked to {linkedPlayer.name}.
              </p>
            </div>
            
            <button
              onClick={() => navigate(`/dashboard/parent/child/${linkedPlayer._id}`)}
              className="btn btn-primary w-full"
            >
              View Child's Profile
            </button>
            
            <button
              onClick={() => {
                setSuccess(false);
                setAccessCode('');
                setRelationship('parent');
                setLinkedPlayer(null);
              }}
              className="btn btn-outline mt-2 w-full"
            >
              Link Another Child
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-sm text-blue-700">
                To link your account to your child's profile, ask them to generate an access code from their profile settings. 
                Enter that code below to establish the connection.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 p-4 rounded-md mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  className="input w-full"
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="input w-full"
                  disabled={loading}
                >
                  <option value="parent">Parent</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Linking...
                  </>
                ) : (
                  <>
                    <FaLink className="mr-2" />
                    Link to Child
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LinkChild; 