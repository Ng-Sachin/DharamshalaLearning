import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CampusJoiningDateModal from './CampusJoiningDateModal';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const { currentUser, userData, loading, setUserData } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser || !userData) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check admin access if required
  if (requireAdmin && !userData.isAdmin && userData.role !== 'academic_associate') {
    return <Navigate to="/unauthorized" replace />;
  }

    // If user hasn't set campus joining date and is not admin, force them to fill it before entering
    if (!userData.campus_joining_date && !userData.isAdmin) {
      return (
        <>
          <CampusJoiningDateModal
            isOpen={true}
            user={userData}
            // Do not allow skipping when required by ProtectedRoute
            requireFill={true}
            onClose={() => {
              // no-op when required
            }}
            onDateUpdated={(updatedUser) => {
              // Update auth context with the filled date so ProtectedRoute will render children afterwards
              setUserData(updatedUser);
            }}
          />
        </>
      );
    }

  return <>{children}</>;
};

export default ProtectedRoute;