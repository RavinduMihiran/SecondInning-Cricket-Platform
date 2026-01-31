import { useState } from 'react';
import { FaTimes, FaSpinner, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { recordNewStats } from '../services/statsService';

const StatsRecordModal = ({ isOpen, onClose, onStatsAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('batting');
  
  const [formData, setFormData] = useState({
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    venue: '',
    format: 'T20',
    result: 'No Result',
    batting: {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dismissal: 'Not Out',
      position: 1
    },
    bowling: {
      overs: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      dotBalls: 0
    },
    fielding: {
      catches: 0,
      runOuts: 0,
      stumpings: 0
    },
    highlights: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert numeric string values to numbers
      const processedData = {
        ...formData,
        batting: {
          ...formData.batting,
          runs: Number(formData.batting.runs),
          balls: Number(formData.batting.balls),
          fours: Number(formData.batting.fours),
          sixes: Number(formData.batting.sixes),
          position: Number(formData.batting.position)
        },
        bowling: {
          ...formData.bowling,
          overs: Number(formData.bowling.overs),
          maidens: Number(formData.bowling.maidens),
          runs: Number(formData.bowling.runs),
          wickets: Number(formData.bowling.wickets),
          dotBalls: Number(formData.bowling.dotBalls)
        },
        fielding: {
          ...formData.fielding,
          catches: Number(formData.fielding.catches),
          runOuts: Number(formData.fielding.runOuts),
          stumpings: Number(formData.fielding.stumpings)
        }
      };

      const result = await recordNewStats(processedData);
      toast.success('Stats recorded successfully!');
      onStatsAdded(result.updatedStats);
      onClose();
    } catch (error) {
      console.error('Error recording stats:', error);
      toast.error(error.response?.data?.message || 'Failed to record stats');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Record New Stats</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Match Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Match Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Opponent*
                </label>
                <input
                  type="text"
                  name="opponent"
                  value={formData.opponent}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Opponent team name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input w-full pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Match venue"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Format
                </label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                  <option value="T10">T10</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Result
                </label>
                <select
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="Win">Win</option>
                  <option value="Loss">Loss</option>
                  <option value="Draw">Draw</option>
                  <option value="No Result">No Result</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Performance Tabs */}
          <div className="mb-6">
            <div className="flex border-b">
              <button
                type="button"
                className={`py-2 px-4 font-medium border-b-2 ${
                  activeTab === 'batting' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('batting')}
              >
                Batting
              </button>
              <button
                type="button"
                className={`py-2 px-4 font-medium border-b-2 ${
                  activeTab === 'bowling' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('bowling')}
              >
                Bowling
              </button>
              <button
                type="button"
                className={`py-2 px-4 font-medium border-b-2 ${
                  activeTab === 'fielding' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('fielding')}
              >
                Fielding
              </button>
            </div>
            
            <div className="mt-4">
              {/* Batting Tab */}
              {activeTab === 'batting' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Runs
                    </label>
                    <input
                      type="number"
                      value={formData.batting.runs}
                      onChange={(e) => handleNestedChange('batting', 'runs', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Balls
                    </label>
                    <input
                      type="number"
                      value={formData.batting.balls}
                      onChange={(e) => handleNestedChange('batting', 'balls', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Fours
                    </label>
                    <input
                      type="number"
                      value={formData.batting.fours}
                      onChange={(e) => handleNestedChange('batting', 'fours', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Sixes
                    </label>
                    <input
                      type="number"
                      value={formData.batting.sixes}
                      onChange={(e) => handleNestedChange('batting', 'sixes', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Batting Position
                    </label>
                    <input
                      type="number"
                      value={formData.batting.position}
                      onChange={(e) => handleNestedChange('batting', 'position', e.target.value)}
                      className="input w-full"
                      min="1"
                      max="11"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Dismissal
                    </label>
                    <select
                      value={formData.batting.dismissal}
                      onChange={(e) => handleNestedChange('batting', 'dismissal', e.target.value)}
                      className="input w-full"
                    >
                      <option value="Not Out">Not Out</option>
                      <option value="Bowled">Bowled</option>
                      <option value="Caught">Caught</option>
                      <option value="LBW">LBW</option>
                      <option value="Run Out">Run Out</option>
                      <option value="Stumped">Stumped</option>
                      <option value="Hit Wicket">Hit Wicket</option>
                      <option value="Did Not Bat">Did Not Bat</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Bowling Tab */}
              {activeTab === 'bowling' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Overs
                    </label>
                    <input
                      type="number"
                      value={formData.bowling.overs}
                      onChange={(e) => handleNestedChange('bowling', 'overs', e.target.value)}
                      className="input w-full"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Maidens
                    </label>
                    <input
                      type="number"
                      value={formData.bowling.maidens}
                      onChange={(e) => handleNestedChange('bowling', 'maidens', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Runs Conceded
                    </label>
                    <input
                      type="number"
                      value={formData.bowling.runs}
                      onChange={(e) => handleNestedChange('bowling', 'runs', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Wickets
                    </label>
                    <input
                      type="number"
                      value={formData.bowling.wickets}
                      onChange={(e) => handleNestedChange('bowling', 'wickets', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Dot Balls
                    </label>
                    <input
                      type="number"
                      value={formData.bowling.dotBalls}
                      onChange={(e) => handleNestedChange('bowling', 'dotBalls', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                </div>
              )}
              
              {/* Fielding Tab */}
              {activeTab === 'fielding' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Catches
                    </label>
                    <input
                      type="number"
                      value={formData.fielding.catches}
                      onChange={(e) => handleNestedChange('fielding', 'catches', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total catches taken</p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Run Outs
                    </label>
                    <input
                      type="number"
                      value={formData.fielding.runOuts}
                      onChange={(e) => handleNestedChange('fielding', 'runOuts', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Direct hits or assists</p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Stumpings
                    </label>
                    <input
                      type="number"
                      value={formData.fielding.stumpings}
                      onChange={(e) => handleNestedChange('fielding', 'stumpings', e.target.value)}
                      className="input w-full"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">For wicketkeepers</p>
                  </div>
                  
                  <div className="col-span-2 mt-2">
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-700 font-medium">
                        Total Fielding Contributions: {Number(formData.fielding.catches) + Number(formData.fielding.runOuts) + Number(formData.fielding.stumpings)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Highlights */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Highlights / Notes
            </label>
            <textarea
              name="highlights"
              value={formData.highlights}
              onChange={handleChange}
              className="input w-full h-24"
              placeholder="Any notable performances or moments from the match"
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : 'Save Stats'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatsRecordModal; 