import React, { useState, useEffect } from 'react';
import { DataSeedingService } from '../../services/dataSeedingService';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Users,
  Target,
  UserCog
} from 'lucide-react';
const AdminDashboard: React.FC = () => {
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
        await loadDataStatus(); // Refresh status
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
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage campus learning data and configuration</p>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Database Operations */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Operations</h2>
          <div className="flex space-x-4">
            {/* Existing Seed Data Button */}
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className={`flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isSeeding ? 'bg-primary-400' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <Database className="h-5 w-5" />
              <span>{isSeeding ? 'Seeding Data...' : 'Seed Initial Data'}</span>
            </button>


          </div>
        </div>

        {/* Data Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Learning Phases</p>
                <p className="text-2xl font-semibold text-gray-900">{dataStatus.phasesCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Learning Topics</p>
                <p className="text-2xl font-semibold text-gray-900">{dataStatus.topicsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Data Status</p>
                <p className={`text-lg font-semibold ${dataStatus.isSeeded ? 'text-green-600' : 'text-red-600'}`}>
                  {dataStatus.isSeeded ? 'Initialized' : 'Not Initialized'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
            <p className="text-sm text-gray-500">Initialize or manage curriculum data</p>
          </div>
          
          <div className="p-6">
            {!dataStatus.isSeeded ? (
              <div className="text-center py-8">
                <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Curriculum Data Found</h3>
                <p className="text-gray-500 mb-6">
                  Initialize the learning phases and topics to get started with the campus learning dashboard.
                </p>
                <button
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {isSeeding ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5" />
                      <span>Initialize Curriculum Data</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Curriculum Data Initialized</h3>
                <p className="text-gray-500 mb-6">
                  The campus learning dashboard is ready with {dataStatus.phasesCount} phases and {dataStatus.topicsCount} topics.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={loadDataStatus}
                    className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center space-x-2 mx-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {dataStatus.isSeeded && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Curriculum Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Learning Phases</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Foundation Phase</span>
                      <span className="text-gray-900">6 topics</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Development Phase</span>
                      <span className="text-gray-900">7 topics</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Advanced Phase</span>
                      <span className="text-gray-900">7 topics</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Key Features</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• Goal templates for each topic</div>
                    <div>• Achievement level tracking</div>
                    <div>• Mentor review workflow</div>
                    <div>• Progress monitoring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;