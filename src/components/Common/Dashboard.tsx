import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SpinnerLoader } from './BoltLoaderComponent';

const Dashboard: React.FC = () => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <SpinnerLoader />;
  }

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // Allow all authenticated users to access mentor dashboard
  // The dashboard will show different content based on user role
  return <Navigate to="/mentor/dashboard" replace />;
};

export default Dashboard;