import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import cricketLogo from '../../assets/images/cricketlogo.png';
import { AuthContext } from '../../contexts/AuthContext';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login } = useContext(AuthContext);
  
  // Get the path the user was trying to access before being redirected to login
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Use the AuthContext login function
      const response = await login(values.email, values.password);
      
      // Redirect to dashboard or previous page based on user role
      if (response && response.user && (response.user.role === 'coach' || response.user.role === 'scout')) {
        navigate('/dashboard'); // This will load the coach dashboard
      } else {
        navigate(from);
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Cricket Image */}
      <div className="hidden md:block md:w-1/2 bg-blue-900">
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <img src={cricketLogo} alt="SecondInning Logo" className="w-20 h-auto" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-blue-200 max-w-sm mx-auto">
              Sign in to continue your cricket journey and track your progress on SecondInning.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
            <p className="text-gray-600">Access your SecondInning account</p>
          </div>

          {loginError && (
            <div className="alert alert-error mb-6">
              {loginError}
            </div>
          )}

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
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
                      placeholder="Enter your password"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <div>
                    <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-3"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
              </Form>
            )}
          </Formik>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:text-primary-dark">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 