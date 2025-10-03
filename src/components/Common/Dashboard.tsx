import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on admin status
  if (userData.isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // For non-admin users, redirect to student dashboard by default
  return <Navigate to="/student/dashboard" replace />;
};

export default Dashboard;