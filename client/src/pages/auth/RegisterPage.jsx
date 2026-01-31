import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSchool, FaMapMarkerAlt } from 'react-icons/fa';
import cricketLogo from '../../assets/images/cricketlogo.png';
import { AuthContext } from '../../contexts/AuthContext';
import { sriLankaDistricts } from '../../utils/districtUtils';
import DistrictDropdown from '../../components/DistrictDropdown';

const userRoles = [
  { id: 'player', label: 'Player' },
  { id: 'coach', label: 'Coach' },
  { id: 'scout', label: 'Scout' },
  { id: 'parent', label: 'Parent' }
];

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name is too short')
    .max(50, 'Name is too long')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: Yup.string()
    .required('Role is required'),
  school: Yup.string()
    .when('role', {
      is: 'player',
      then: (schema) => schema.required('School is required for players'),
      otherwise: (schema) => schema
    }),
  district: Yup.string()
    .when('role', {
      is: (role) => role === 'player' || role === 'coach' || role === 'scout',
      then: (schema) => schema.required('District is required'),
      otherwise: (schema) => schema
    }),
  termsAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const { register, login } = useContext(AuthContext);
  
  // Get the path the user was trying to access before being redirected to login
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Use the AuthContext register function
      const registerResponse = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        school: values.school,
        district: values.district
      });
      
      // Log the user in after successful registration
      await login(values.email, values.password);
      
      // Use setTimeout to delay navigation slightly to prevent React update depth issues
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (error) {
      setRegisterError(error.response?.data?.message || 'Registration failed. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Join SecondInning and start your cricket journey</p>
          </div>

          {registerError && (
            <div className="alert alert-error mb-6">
              {registerError}
            </div>
          )}

          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: '',
              school: '',
              district: '',
              termsAccepted: false
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-5">
                <div>
                  <label htmlFor="name" className="label">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <Field
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="email" className="label">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <Field
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="password" className="label">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a password"
                      className="input pl-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-gray-400" />
                      ) : (
                        <FaEye className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I am a
                  </label>
                  <Field
                    as="select"
                    name="role"
                    className="input w-full"
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="scout">Scout</option>
                    <option value="parent">Parent</option>
                  </Field>
                  <ErrorMessage name="role" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {values.role === 'player' && (
                  <>
                    <div>
                      <label htmlFor="school" className="label">School</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaSchool className="text-gray-400" />
                        </div>
                        <Field
                          type="text"
                          name="school"
                          placeholder="Enter your school name"
                          className="input pl-10"
                        />
                      </div>
                      <ErrorMessage name="school" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label htmlFor="district" className="label">District</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaMapMarkerAlt className="text-gray-400" />
                        </div>
                        <Field name="district">
                          {({ field, form }) => (
                            <DistrictDropdown
                              value={field.value}
                              onChange={(e) => form.setFieldValue('district', e.target.value)}
                              name="district"
                              id="district"
                              className="pl-10"
                              placeholder="Select your district"
                              labelText=""
                            />
                          )}
                        </Field>
                      </div>
                      <ErrorMessage name="district" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </>
                )}

                {values.role === 'coach' && (
                  <>
                    <div>
                      <label htmlFor="district" className="label">District</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaMapMarkerAlt className="text-gray-400" />
                        </div>
                        <Field name="district">
                          {({ field, form }) => (
                            <DistrictDropdown
                              value={field.value}
                              onChange={(e) => form.setFieldValue('district', e.target.value)}
                              name="district"
                              id="district"
                              className="pl-10"
                              placeholder="Select your district"
                              labelText=""
                            />
                          )}
                        </Field>
                      </div>
                      <ErrorMessage name="district" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </>
                )}

                {values.role === 'scout' && (
                  <>
                    <div>
                      <label htmlFor="district" className="label">District</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaMapMarkerAlt className="text-gray-400" />
                        </div>
                        <Field name="district">
                          {({ field, form }) => (
                            <DistrictDropdown
                              value={field.value}
                              onChange={(e) => form.setFieldValue('district', e.target.value)}
                              name="district"
                              id="district"
                              className="pl-10"
                              placeholder="Select your district"
                              labelText=""
                            />
                          )}
                        </Field>
                      </div>
                      <ErrorMessage name="district" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </>
                )}

                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    name="termsAccepted"
                    id="termsAccepted"
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
                    I accept the <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link>
                  </label>
                </div>
                <ErrorMessage name="termsAccepted" component="div" className="text-red-500 text-sm mt-1" />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-3 mt-6"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </Form>
            )}
          </Formik>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-primary-dark">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Cricket Image */}
      <div className="hidden md:block md:w-1/2 bg-blue-900">
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <img src={cricketLogo} alt="SecondInning Logo" className="w-20 h-auto" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Join SecondInning</h2>
            <p className="text-blue-200 max-w-sm mx-auto">
              Create your account today and start your journey to becoming the next cricket star. Whether you're a player, coach, scout, or parent, we'll help you connect with the cricket community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 