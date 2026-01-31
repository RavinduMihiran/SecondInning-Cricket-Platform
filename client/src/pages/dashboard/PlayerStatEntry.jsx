import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaCalendarAlt, FaUsers, FaTrophy, FaMapMarkerAlt, FaBolt } from 'react-icons/fa';
import { GiCricketBat } from 'react-icons/gi';

const StatEntrySchema = Yup.object().shape({
  matchDate: Yup.date()
    .required('Match date is required')
    .max(new Date(), 'Match date cannot be in the future'),
  opponent: Yup.string()
    .required('Opponent team is required')
    .min(3, 'Opponent name is too short'),
  venue: Yup.string()
    .required('Venue is required'),
  matchType: Yup.string()
    .required('Match type is required'),
  batting: Yup.object().shape({
    didBat: Yup.boolean(),
    runsScored: Yup.number()
      .when('didBat', {
        is: true,
        then: schema => schema.required('Runs are required').min(0, 'Runs cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
    ballsFaced: Yup.number()
      .when('didBat', {
        is: true,
        then: schema => schema.required('Balls faced is required').min(0, 'Balls faced cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
    fours: Yup.number()
      .when('didBat', {
        is: true,
        then: schema => schema.required('Number of fours is required').min(0, 'Value cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
    sixes: Yup.number()
      .when('didBat', {
        is: true,
        then: schema => schema.required('Number of sixes is required').min(0, 'Value cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
    howOut: Yup.string()
      .when('didBat', {
        is: true,
        then: schema => schema.required('How you got out is required'),
        otherwise: schema => schema.notRequired()
      }),
  }),
  bowling: Yup.object().shape({
    didBowl: Yup.boolean(),
    oversBowled: Yup.number()
      .when('didBowl', {
        is: true,
        then: schema => schema.required('Overs bowled is required').min(0, 'Overs cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
    maidensRecorded: Yup.number()
      .when('didBowl', {
        is: true,
        then: schema => schema.required('Maidens is required').min(0, 'Value cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
    runsGiven: Yup.number()
      .when('didBowl', {
        is: true,
        then: schema => schema.required('Runs given is required').min(0, 'Runs cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
    wicketsTaken: Yup.number()
      .when('didBowl', {
        is: true,
        then: schema => schema.required('Wickets is required').min(0, 'Value cannot be negative'),
        otherwise: schema => schema.notRequired()
      }),
  }),
  fielding: Yup.object().shape({
    catches: Yup.number()
      .required('Required')
      .min(0, 'Value cannot be negative'),
    runOuts: Yup.number()
      .required('Required')
      .min(0, 'Value cannot be negative'),
    stumpings: Yup.number()
      .required('Required')
      .min(0, 'Value cannot be negative'),
  }),
  matchNotes: Yup.string(),
  uploadEvidence: Yup.boolean(),
});

const PlayerStatEntry = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const matchTypes = [
    'School Match', 
    'Inter-School Match', 
    'District Level', 
    'Provincial Level', 
    'Friendly Match', 
    'Tournament Match', 
    'Other'
  ];

  const dismissalOptions = [
    'Not Out',
    'Bowled',
    'Caught',
    'LBW',
    'Run Out',
    'Stumped',
    'Hit Wicket',
    'Retired Hurt',
    'Other'
  ];

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Submitted values:', values);
      setSuccessMessage('Your match statistics have been successfully recorded!');
      resetForm();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error submitting stats:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Record Match Statistics</h1>
      
      {successMessage && (
        <div className="alert alert-success mb-6">
          {successMessage}
        </div>
      )}
      
      <div className="card bg-white p-6">
        <Formik
          initialValues={{
            matchDate: '',
            opponent: '',
            venue: '',
            matchType: '',
            batting: {
              didBat: false,
              runsScored: '',
              ballsFaced: '',
              fours: '',
              sixes: '',
              howOut: '',
            },
            bowling: {
              didBowl: false,
              oversBowled: '',
              maidensRecorded: '',
              runsGiven: '',
              wicketsTaken: '',
            },
            fielding: {
              catches: 0,
              runOuts: 0,
              stumpings: 0,
            },
            matchNotes: '',
            uploadEvidence: false,
          }}
          validationSchema={StatEntrySchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form className="space-y-8">
              {/* Match Details Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Match Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor="matchDate" className="label flex items-center">
                      <FaCalendarAlt className="mr-2 text-gray-500" /> Match Date
                    </label>
                    <Field 
                      type="date" 
                      id="matchDate" 
                      name="matchDate" 
                      className="input"
                    />
                    <ErrorMessage name="matchDate" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="opponent" className="label flex items-center">
                      <FaUsers className="mr-2 text-gray-500" /> Opponent Team
                    </label>
                    <Field 
                      type="text" 
                      id="opponent" 
                      name="opponent" 
                      placeholder="e.g. Richmond College" 
                      className="input"
                    />
                    <ErrorMessage name="opponent" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="venue" className="label flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-gray-500" /> Venue
                    </label>
                    <Field 
                      type="text" 
                      id="venue" 
                      name="venue" 
                      placeholder="e.g. School Ground" 
                      className="input"
                    />
                    <ErrorMessage name="venue" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="matchType" className="label flex items-center">
                      <FaTrophy className="mr-2 text-gray-500" /> Match Type
                    </label>
                    <Field 
                      as="select" 
                      id="matchType" 
                      name="matchType" 
                      className="input"
                    >
                      <option value="">Select Match Type</option>
                      {matchTypes.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="matchType" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>
              
              {/* Batting Section */}
              <div>
                <div className="flex items-center mb-4">
                  <FaBolt className="mr-2 text-secondary h-5 w-5" />
                  <h2 className="text-xl font-semibold">Batting Performance</h2>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Field 
                      type="checkbox" 
                      name="batting.didBat" 
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <span>I batted in this match</span>
                  </label>
                </div>
                
                {values.batting.didBat && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
                    <div>
                      <label htmlFor="batting.runsScored" className="label">Runs Scored</label>
                      <Field 
                        type="number" 
                        id="batting.runsScored" 
                        name="batting.runsScored" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="batting.runsScored" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="batting.ballsFaced" className="label">Balls Faced</label>
                      <Field 
                        type="number" 
                        id="batting.ballsFaced" 
                        name="batting.ballsFaced" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="batting.ballsFaced" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="batting.fours" className="label">4s</label>
                      <Field 
                        type="number" 
                        id="batting.fours" 
                        name="batting.fours" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="batting.fours" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="batting.sixes" className="label">6s</label>
                      <Field 
                        type="number" 
                        id="batting.sixes" 
                        name="batting.sixes" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="batting.sixes" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="batting.howOut" className="label">How Out</label>
                      <Field 
                        as="select" 
                        id="batting.howOut" 
                        name="batting.howOut" 
                        className="input"
                      >
                        <option value="">Select</option>
                        {dismissalOptions.map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="batting.howOut" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    {/* Calculated Strike Rate (for display only) */}
                    <div>
                      <label className="label">Strike Rate</label>
                      <div className="input bg-gray-100 flex items-center">
                        {values.batting.runsScored && values.batting.ballsFaced 
                          ? ((values.batting.runsScored / values.batting.ballsFaced) * 100).toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bowling Section */}
              <div>
                <div className="flex items-center mb-4">
                  <GiCricketBat className="mr-2 text-primary h-5 w-5" />
                  <h2 className="text-xl font-semibold">Bowling Performance</h2>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Field 
                      type="checkbox" 
                      name="bowling.didBowl" 
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <span>I bowled in this match</span>
                  </label>
                </div>
                
                {values.bowling.didBowl && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
                    <div>
                      <label htmlFor="bowling.oversBowled" className="label">Overs Bowled</label>
                      <Field 
                        type="number" 
                        id="bowling.oversBowled" 
                        name="bowling.oversBowled" 
                        step="0.1" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="bowling.oversBowled" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="bowling.maidensRecorded" className="label">Maidens</label>
                      <Field 
                        type="number" 
                        id="bowling.maidensRecorded" 
                        name="bowling.maidensRecorded" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="bowling.maidensRecorded" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="bowling.runsGiven" className="label">Runs Given</label>
                      <Field 
                        type="number" 
                        id="bowling.runsGiven" 
                        name="bowling.runsGiven" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="bowling.runsGiven" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div>
                      <label htmlFor="bowling.wicketsTaken" className="label">Wickets</label>
                      <Field 
                        type="number" 
                        id="bowling.wicketsTaken" 
                        name="bowling.wicketsTaken" 
                        min="0" 
                        className="input"
                      />
                      <ErrorMessage name="bowling.wicketsTaken" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    {/* Calculated Economy Rate (for display only) */}
                    <div>
                      <label className="label">Economy Rate</label>
                      <div className="input bg-gray-100 flex items-center">
                        {values.bowling.oversBowled && values.bowling.runsGiven 
                          ? (values.bowling.runsGiven / values.bowling.oversBowled).toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Fielding Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Fielding Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="fielding.catches" className="label">Catches</label>
                    <Field 
                      type="number" 
                      id="fielding.catches" 
                      name="fielding.catches" 
                      min="0" 
                      className="input"
                    />
                    <ErrorMessage name="fielding.catches" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div>
                    <label htmlFor="fielding.runOuts" className="label">Run Outs</label>
                    <Field 
                      type="number" 
                      id="fielding.runOuts" 
                      name="fielding.runOuts" 
                      min="0" 
                      className="input"
                    />
                    <ErrorMessage name="fielding.runOuts" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div>
                    <label htmlFor="fielding.stumpings" className="label">Stumpings</label>
                    <Field 
                      type="number" 
                      id="fielding.stumpings" 
                      name="fielding.stumpings" 
                      min="0" 
                      className="input"
                    />
                    <ErrorMessage name="fielding.stumpings" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>
              
              {/* Additional Notes */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                
                <div className="mb-4">
                  <label htmlFor="matchNotes" className="label">Match Notes (optional)</label>
                  <Field 
                    as="textarea" 
                    id="matchNotes" 
                    name="matchNotes" 
                    rows="3" 
                    placeholder="Add any additional notes about your performance or the match..." 
                    className="input"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Field 
                      type="checkbox" 
                      name="uploadEvidence" 
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <span>I want to upload evidence (photos, scorecard, videos)</span>
                  </label>
                </div>
                
                {values.uploadEvidence && (
                  <div className="p-4 bg-gray-50 rounded-md mb-4">
                    <p className="mb-2">You'll be able to upload media after submitting your stats.</p>
                    <input type="file" disabled className="opacity-50" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary px-8 py-3"
                >
                  {isSubmitting ? 'Submitting...' : 'Save Statistics'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PlayerStatEntry; 