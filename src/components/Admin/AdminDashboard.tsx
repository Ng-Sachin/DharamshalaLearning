import React, { useState, useEffect } from 'react';
import PhaseTimelineAdminPanel from './PhaseTimelineAdminPanel';
// import removed: useNavigate
import { DataSeedingService } from '../../services/dataSeedingService';
import AdminUserManagement from './AdminUserManagement';
import MentorAssignment from './MentorAssignment';
import CurriculumAdminPanel from './CurriculumAdminPanel';
import SuperMentorManagement from './SuperMentorManagement';
// MentorRequestApproval now integrated into MentorAssignment
// Removed unused lucide-react icon imports
import BugReportAdminPanel from './BugReportAdminPanel';
import AdminJourneyTracking from './AdminJourneyTracking';
import AttendanceDashboard from './AttendanceDashboard';


const AdminDashboard: React.FC = () => {
  const [loading] = useState(false); // Fixed: was stuck on true
  const [seeding, setSeeding] = useState(false);

  // Removed loadDataStatus and related useEffect

  // handleSeedData removed

  // Main and sub tab structure
  const mainTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'user-management', label: 'User Management' },
    { id: 'reports', label: 'Reports' },
    { id: 'backend', label: 'Backend Management' },
  ];
  const subTabs: { [key: string]: { id: string; label: string }[] } = React.useMemo(() => ({
    overview: [],
    'user-management': [
      { id: 'users', label: 'User Management' },
      { id: 'mentors', label: 'Mentor Management' },
      { id: 'super-mentors', label: 'Super Mentors' },
    ],
    reports: [
      { id: 'reports', label: 'Overview' },
      { id: 'journey-tracking', label: 'Journey Tracking' },
      { id: 'phase-timeline', label: 'Phase Timeline' },
      { id: 'attendance', label: 'Attendance Dashboard' },
    ],
    backend: [
      { id: 'curriculum', label: 'Curriculum' },
      { id: 'database', label: 'Database Operations' },
      { id: 'bug-reports', label: 'Bug Reports' },
    ],
  }), []);

  // Track main and sub tab with localStorage persistence
  const [mainTab, setMainTab] = useState<string>(() => {
    return localStorage.getItem('admin-main-tab') || 'overview';
  });
  const [subTab, setSubTab] = useState<string>(() => {
    return localStorage.getItem('admin-sub-tab') || 'overview';
  });

  useEffect(() => {
    // When main tab changes, set subTab to first in group or overview
    const newSubTab = subTabs[mainTab][0]?.id || 'overview';
    setSubTab(newSubTab);
    localStorage.setItem('admin-sub-tab', newSubTab);
  }, [mainTab, subTabs]);

  // Persist tab state to localStorage
  const handleMainTabChange = (tabId: string) => {
    setMainTab(tabId);
    localStorage.setItem('admin-main-tab', tabId);
  };

  const handleSubTabChange = (tabId: string) => {
    setSubTab(tabId);
    localStorage.setItem('admin-sub-tab', tabId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Main Tabs */}
      <nav className="flex space-x-4 mb-4">
        {mainTabs.map((tab: { id: string; label: string }) => (
          <button
            key={tab.id}
            onClick={() => handleMainTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${mainTab === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Sub Tabs */}
      {subTabs[mainTab].length > 0 && (
        <nav className="flex space-x-2 mb-6">
          {subTabs[mainTab].map((tab: { id: string; label: string }) => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={`px-3 py-1 rounded font-medium text-xs transition-colors ${subTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-50 text-gray-600 hover:bg-primary-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {mainTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Overview</h2>
            {/* ...overview content... */}
          </div>
        )}
        {mainTab === 'user-management' && subTab === 'users' && (
          <div className="p-6">
            <AdminUserManagement />
          </div>
        )}
        {mainTab === 'user-management' && subTab === 'mentors' && (
          <div className="p-6">
            <MentorAssignment />
          </div>
        )}
        {mainTab === 'user-management' && subTab === 'super-mentors' && (
          <div className="p-6">
            <SuperMentorManagement />
          </div>
        )}
        {mainTab === 'reports' && subTab === 'reports' && (
          <div className="p-6">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reports Coming Soon</h3>
              <p className="text-gray-600">
                Detailed analytics and student reports will be available here
              </p>
            </div>
          </div>
        )}
        {mainTab === 'reports' && subTab === 'journey-tracking' && (
          <div className="p-6">
            <AdminJourneyTracking />
          </div>
        )}
        {mainTab === 'reports' && subTab === 'phase-timeline' && (
          <div className="p-6">
            <PhaseTimelineAdminPanel />
          </div>
        )}
        {mainTab === 'backend' && subTab === 'curriculum' && (
          <div className="p-6">
            <CurriculumAdminPanel />
          </div>
        )}
        {mainTab === 'backend' && subTab === 'database' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Database Operations</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Curriculum Data Management</h3>
              <p className="text-gray-600 mb-4">
                Initialize the unified Induction curriculum with all 25 activities:
              </p>
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>1 Phase:</strong> "Induction: Life Skills & Learning" (30 days)</li>
                  <li>• <strong>18 Life Skills:</strong> LS0-LS8 + 7 English sub-quests + 2 bonus quests</li>
                  <li>• <strong>8 Learning Quests:</strong> LE1-LE8 covering learning methodology to portfolio</li>
                  <li>• <strong>Total:</strong> 25 trackable activities with detailed descriptions</li>
                </ul>
              </div>
              <button
                onClick={async () => {
                  setSeeding(true);
                  try {
                    console.log('🌱 Starting curriculum data seeding...');
                    await DataSeedingService.seedInitialData();
                    console.log('✅ Curriculum data seeded successfully!');
                    alert('✅ Curriculum data has been successfully seeded to Firestore!\n\nAll 25 activities in the unified "Induction: Life Skills & Learning" phase have been created.');
                  } catch (error) {
                    console.error('❌ Error seeding curriculum data:', error);
                    alert('❌ Failed to seed curriculum data. Check console for details.\n\nError: ' + (error as Error).message);
                  } finally {
                    setSeeding(false);
                  }
                }}
                disabled={seeding}
                className={`px-4 py-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  seeding 
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {seeding ? 'Seeding Data...' : 'Seed Curriculum Data'}
              </button>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-red-600 mb-2 text-sm">
                  ⚠️ <strong>Clean Up Old Data:</strong> Remove existing curriculum data before seeding new data.
                </p>
                <button
                  onClick={async () => {
                    // eslint-disable-next-line no-restricted-globals
                    if (!confirm('⚠️ This will DELETE ALL existing curriculum data in Firebase!\n\nThis includes all phases and topics. Are you sure you want to continue?')) {
                      return;
                    }
                    
                    setSeeding(true);
                    try {
                      console.log('🧹 Starting curriculum data cleanup...');
                      await DataSeedingService.cleanupCurriculumData();
                      console.log('✅ Curriculum data cleaned up successfully!');
                      alert('✅ All old curriculum data has been removed from Firebase!\n\nYou can now seed the new unified curriculum data.');
                    } catch (error) {
                      console.error('❌ Error cleaning up curriculum data:', error);
                      alert('❌ Failed to clean up curriculum data. Check console for details.\n\nError: ' + (error as Error).message);
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  disabled={seeding}
                  className={`px-4 py-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    seeding 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {seeding ? 'Cleaning Up...' : 'Clean Up Old Data'}
                </button>
                
                <button
                  onClick={async () => {
                    // eslint-disable-next-line no-restricted-globals
                    if (!confirm('🔄 This will CLEAN UP old data and SEED the new unified curriculum!\n\nThis includes:\n1. Delete all existing phases and topics\n2. Create the new unified Induction phase with 25 activities\n\nProceed?')) {
                      return;
                    }
                    
                    setSeeding(true);
                    try {
                      console.log('🔄 Starting clean & seed process...');
                      
                      // Step 1: Clean up
                      console.log('🧹 Step 1: Cleaning up old data...');
                      await DataSeedingService.cleanupCurriculumData();
                      console.log('✅ Old data cleaned up');
                      
                      // Step 2: Seed new data
                      console.log('🌱 Step 2: Seeding new curriculum...');
                      await DataSeedingService.seedInitialData();
                      console.log('✅ New curriculum seeded');
                      
                      alert('🎉 SUCCESS!\n\n✅ Old curriculum data cleaned up\n✅ New unified curriculum with 25 activities created\n\nStudents will now see the updated curriculum!');
                    } catch (error) {
                      console.error('❌ Error during clean & seed process:', error);
                      alert('❌ Failed during clean & seed process. Check console for details.\n\nError: ' + (error as Error).message);
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  disabled={seeding}
                  className={`ml-2 px-4 py-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    seeding 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {seeding ? 'Processing...' : '🔄 Clean & Seed New Data'}
                </button>
              </div>
            </div>
          </div>
        )}
        {mainTab === 'reports' && subTab === 'attendance' && (
          <div className="p-6">
            <AttendanceDashboard />
          </div>
        )}
        {mainTab === 'backend' && subTab === 'bug-reports' && (
          <div className="p-6">
            <BugReportAdminPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
