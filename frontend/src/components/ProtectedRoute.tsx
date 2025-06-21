import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  console.log('ProtectedRoute: isAuthenticated:', isAuthenticated, 'path:', location.pathname);

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Redirecting to login from:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: Allowing access to:', location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute; 