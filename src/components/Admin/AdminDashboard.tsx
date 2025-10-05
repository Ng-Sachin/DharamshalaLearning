import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataSeedingService } from '../../services/dataSeedingService';
import AdminUserManagement from './AdminUserManagement';
import MentorAssignment from './MentorAssignment';
import CurriculumAdminPanel from './CurriculumAdminPanel';
import SuperMentorManagement from './SuperMentorManagement';
import MentorRequestApproval from './MentorRequestApproval';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Star,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import BugReportAdminPanel from './BugReportAdminPanel';

type TabType = 'overview' | 'users' | 'mentors' | 'super-mentors' | 'mentor-requests' | 'reports' | 'curriculum' | 'bug-reports';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dataStatus, setDataStatus] = useState({ phasesCount: 0, topicsCount: 0, isSeeded: false });
  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadDataStatus();
  }, []);

  const loadDataStatus = async () => {
    try {
      setLoading(true);
      const status = await DataSeedingService.getDataStatus();
      setDataStatus(status);
    } catch (error) {
      console.error('Error loading data status:', error);
      setError('Failed to load data status');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      setError('');
      setSuccess('');
      
      const result = await DataSeedingService.seedInitialData();
      if (result) {
        setSuccess('Curriculum data initialized successfully!');
        await loadDataStatus();
      } else {
        setError('Failed to initialize curriculum data');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      setError('Failed to initialize curriculum data');
    } finally {
      setIsSeeding(false);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Database },
    { id: 'users' as TabType, label: 'User Management', icon: Users },
    { id: 'mentors' as TabType, label: 'Mentor Assignment', icon: UserCheck },
    { id: 'super-mentors' as TabType, label: 'Super Mentors', icon: Star },
    { id: 'mentor-requests' as TabType, label: 'Mentor Requests', icon: UserPlus },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
    { id: 'curriculum' as TabType, label: 'Curriculum', icon: Database },
    { id: 'bug-reports' as TabType, label: 'Bug Reports', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Settings className="h-8 w-8 text-primary-600" />
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <p className="text-gray-600">Manage campus learning system</p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">System Overview</h2>
              
              {/* Data Status */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Curriculum Data Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Phases</p>
                        <p className="text-2xl font-bold text-gray-900">{dataStatus.phasesCount}</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Topics</p>
                        <p className="text-2xl font-bold text-gray-900">{dataStatus.topicsCount}</p>
                      </div>
                      <Database className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className={`text-sm font-medium ${dataStatus.isSeeded ? 'text-green-600' : 'text-orange-600'}`}>
                          {dataStatus.isSeeded ? 'Initialized' : 'Not Initialized'}
                        </p>
                      </div>
                      {dataStatus.isSeeded ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-orange-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Seed Data Button */}
                <div className="flex items-start space-x-4">
                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSeeding ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        {dataStatus.isSeeded ? 'Re-Initialize' : 'Initialize'} Curriculum Data
                      </>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {dataStatus.isSeeded 
                        ? 'Curriculum data has been initialized. Click to re-initialize (this will not affect existing user data).'
                        : 'Initialize the curriculum with phases and topics. This is required before students can set goals.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Users className="h-6 w-6 text-blue-600 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-blue-900">Manage Users</p>
                      <p className="text-sm text-blue-700">View and update user roles</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('mentors')}
                    className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <UserCheck className="h-6 w-6 text-green-600 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-green-900">Assign Mentors</p>
                      <p className="text-sm text-green-700">Match students with mentors</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-purple-900">View Reports</p>
                      <p className="text-sm text-purple-700">Analytics and insights</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/admin/bug-reports')}
                    className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-6 w-6 text-orange-600 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-orange-900">Bug Reports</p>
                      <p className="text-sm text-orange-700">Review user feedback</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <AdminUserManagement />
            </div>
          )}

          {activeTab === 'mentors' && (
            <div className="p-6">
              <MentorAssignment />
            </div>
          )}

          {activeTab === 'super-mentors' && (
            <div className="p-6">
              <SuperMentorManagement />
            </div>
          )}

          {activeTab === 'mentor-requests' && (
            <div className="p-6">
              <MentorRequestApproval />
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="p-6">
              <CurriculumAdminPanel />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reports Coming Soon</h3>
                <p className="text-gray-600">
                  Detailed analytics and student reports will be available here
                </p>
              </div>
            </div>
          )}

          {activeTab === 'bug-reports' && (
            <div className="p-6">
              <BugReportAdminPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
