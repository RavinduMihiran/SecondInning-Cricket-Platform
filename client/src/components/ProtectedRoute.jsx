import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    // Redirect to login and remember where the user was trying to go
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute; 