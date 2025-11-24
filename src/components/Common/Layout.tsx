import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import ProfileCompletionModal from './ProfileCompletionModal';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userData, setUserData } = useAuth();
  const [hasShownModalThisSession, setHasShownModalThisSession] = useState(false);
  
  const { shouldShowModal, hideModal } = useProfileCompletion(
    userData, 
    hasShownModalThisSession
  );

  const handleProfileUpdated = (updatedUser: typeof userData) => {
    setUserData(updatedUser);
    setHasShownModalThisSession(true);
  };

  const handleModalClose = () => {
    setHasShownModalThisSession(true);
    hideModal();
  };

  // Reset session flag when user changes (e.g., logout/login)
  useEffect(() => {
    if (!userData) {
      setHasShownModalThisSession(false);
    }
  }, [userData]); // Reset when user changes

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navigation />
      
      {/* Main content - with padding for top nav (desktop) and bottom nav (mobile) */}
      <main className="pb-20 md:pb-6 pt-16 md:pt-0">
        <div className="py-4 sm:py-6">
          {/* table-container allows wide content (tables/charts) to scroll on small screens */}
          <div className="table-container">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Profile Completion Modal */}
      {userData && shouldShowModal && (
        <ProfileCompletionModal
          isOpen={shouldShowModal}
          onClose={handleModalClose}
          user={userData}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default Layout;