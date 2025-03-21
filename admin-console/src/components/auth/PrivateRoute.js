import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  // If still loading auth state, render nothing (loading is handled in App.js)
  if (authLoading) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If children is provided, render it, otherwise render the outlet
  return children || <Outlet />;
};

export default PrivateRoute;
