import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import Dashboard from './pages/dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './contexts/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import MediaModeration from './pages/admin/MediaModeration';
import Announcements from './pages/admin/Announcements';
import Analytics from './pages/admin/Analytics';
import SystemManagement from './pages/admin/SystemManagement';
import ActivityLogs from './pages/admin/ActivityLogs';
import Settings from './pages/admin/Settings';
import Security from './pages/admin/Security';
import SocketDebug from './components/SocketDebug';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  // Check if we're in development mode
  const isDevelopment = import.meta.env.MODE === 'development';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner"></div>
        <p className="ml-3 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer position="top-right" theme="dark" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        } />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="media" element={<MediaModeration />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="system" element={<SystemManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<ActivityLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="security" element={<Security />} />
        </Route>
        
        {/* Catch-all route - 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Display socket debug component in development mode */}
      {isDevelopment && isAuthenticated && <SocketDebug />}
    </Router>
  );
}

export default App;
