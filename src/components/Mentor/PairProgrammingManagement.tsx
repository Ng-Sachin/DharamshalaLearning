import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PairProgrammingService } from '../../services/dataServices';
import { UserService } from '../../services/firestore';
import { PairProgrammingRequest, User } from '../../types';
import { 
  Code, 
  Clock, 
  CheckCircle, 
  Users, 
  Calendar,
  MessageSquare,
  Play,
  XCircle
} from 'lucide-react';

interface RequestWithStudent extends PairProgrammingRequest {
  student: User;
}

const PairProgrammingManagement: React.FC = () => {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<RequestWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');

  const loadPairProgrammingRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all requests for this mentor
      const allRequests = await PairProgrammingService.getRequestsByMentor(userData!.id);
      
      // Get student details for each request
      const requestsWithStudents = await Promise.all(
        allRequests.map(async (request) => {
          const student = await UserService.getUserById(request.student_id);
          return {
            ...request,
            student: student!
          } as RequestWithStudent;
        })
      );

      setRequests(requestsWithStudents);
    } catch (error) {
      console.error('Error loading pair programming requests:', error);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.id) {
      loadPairProgrammingRequests();
    }
  }, [userData, loadPairProgrammingRequests]);

  const handleAssignSession = async (requestId: string) => {
    try {
      await PairProgrammingService.assignMentor(requestId, userData!.id);
      await loadPairProgrammingRequests(); // Refresh data
    } catch (error) {
      console.error('Error assigning session:', error);
    }
  };

  const handleCompleteSession = async (requestId: string, feedback: string) => {
    try {
      await PairProgrammingService.completeSession(requestId, feedback);
      await loadPairProgrammingRequests(); // Refresh data
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await PairProgrammingService.cancelRequest(requestId);
      await loadPairProgrammingRequests(); // Refresh data
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'assigned': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'all') return true;
    return request.status === activeFilter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    completed: requests.filter(r => r.status === 'completed').length
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Pair Programming Management</h1>
            <p className="mt-2 text-gray-600">Manage student pair programming requests</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Code className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Assigned</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.assigned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              {(['all', 'pending', 'assigned', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeFilter === filter
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== 'all' && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-full">
                      {stats[filter]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {request.student.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {request.topic}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="mr-4">{request.student.name}</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {request.description && (
                        <p className="text-gray-600 text-sm mb-3">{request.description}</p>
                      )}
                      
                      {request.feedback && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800">Session Feedback</p>
                              <p className="text-sm text-green-700">{request.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {request.assigned_at && (
                        <p className="text-xs text-gray-500">
                          Assigned: {new Date(request.assigned_at).toLocaleString()}
                        </p>
                      )}
                      
                      {request.completed_at && (
                        <p className="text-xs text-gray-500">
                          Completed: {new Date(request.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex-shrink-0 ml-4">
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAssignSession(request.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                        >
                          Assign to Me
                        </button>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'assigned' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const feedback = prompt('Enter session feedback:');
                            if (feedback) {
                              handleCompleteSession(request.id, feedback);
                            }
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors"
                        >
                          Complete Session
                        </button>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <Code className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {activeFilter === 'all' ? '' : activeFilter} requests
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeFilter === 'all' 
                    ? "No pair programming requests have been made yet."
                    : `No ${activeFilter} pair programming requests at the moment.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairProgrammingManagement;