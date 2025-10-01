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

  // Redirect based on user role
  switch (userData.role) {
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'mentor':
      return <Navigate to="/mentor/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

export default Dashboard;