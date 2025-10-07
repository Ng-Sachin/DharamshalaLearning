import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MentorshipService } from '../../services/dataServices';
import { MentorChangeRequest } from '../../types';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  UserCheck,
  Users,
  MessageSquare,
  Loader
} from 'lucide-react';

const MentorRequestApproval: React.FC = () => {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<MentorChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const pendingRequests = await MentorshipService.getPendingMentorRequests();
      // Sort by created_at (newest first)
      const sorted = pendingRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRequests(sorted);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load mentor change requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!userData?.id) return;

    try {
      setProcessing(requestId);
      setError('');
      setSuccess('');

      await MentorshipService.approveMentorRequest(
        requestId,
        userData.id,
        (userData.role === 'admin' || userData.role === 'super_mentor') ? userData.role : 'admin',
        adminNotes[requestId]
      );

      setSuccess('Mentor change request approved successfully');
      await loadPendingRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve mentor change request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!userData?.id) return;

    try {
      setProcessing(requestId);
      setError('');
      setSuccess('');

      await MentorshipService.rejectMentorRequest(
        requestId,
        userData.id,
        adminNotes[requestId]
      );

      setSuccess('Mentor change request rejected');
      await loadPendingRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject mentor change request');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Mentor Change Requests</h2>
        <p className="text-gray-600">Review and approve student mentor change requests</p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Requests */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">All mentor change requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <UserCheck className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.student_name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{request.student_email}</p>
                  <p className="text-xs text-gray-500">
                    Requested on {formatDate(request.created_at)}
                  </p>
                </div>
              </div>

              {/* Mentor Change Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <p className="text-xs font-medium text-gray-600">Current Mentor</p>
                  </div>
                  {request.current_mentor_name ? (
                    <p className="text-sm font-semibold text-gray-900">{request.current_mentor_name}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No mentor assigned</p>
                  )}
                </div>

                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserCheck className="h-4 w-4 text-primary-600" />
                    <p className="text-xs font-medium text-primary-900">Requested Mentor</p>
                  </div>
                  <p className="text-sm font-semibold text-primary-900">{request.requested_mentor_name}</p>
                </div>
              </div>

              {/* Student's Reason */}
              {request.reason && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900 mb-1">Student's Reason:</p>
                      <p className="text-sm text-blue-800">{request.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  value={adminNotes[request.id] || ''}
                  onChange={(e) => setAdminNotes({ ...adminNotes, [request.id]: e.target.value })}
                  placeholder="Add notes about this decision..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processing === request.id}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {processing === request.id ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={processing === request.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {processing === request.id ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Approval Guidelines:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check if the requested mentor has available capacity</li>
              <li>Consider the student's reason for requesting the change</li>
              <li>Approving will immediately assign the new mentor</li>
              <li>Rejecting will clear the pending request status</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorRequestApproval;
