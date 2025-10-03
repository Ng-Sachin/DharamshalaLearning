import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoalService, ReflectionService, PairProgrammingService } from '../../services/dataServices';
import { UserService } from '../../services/firestore';
import { User, DailyGoal, DailyReflection, PairProgrammingRequest } from '../../types';
import { 
  ArrowLeft, 
  Target, 
  BookOpen, 
  CheckCircle, 
  Clock,
  MessageSquare,
  Code
} from 'lucide-react';

const MenteeReview: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<User | null>(null);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [pairRequests, setPairRequests] = useState<PairProgrammingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'reflections' | 'pairs'>('goals');

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!studentId) return;

      const [studentData, goalsData, reflectionsData, pairRequestsData] = await Promise.all([
        UserService.getUserById(studentId),
        GoalService.getGoalsByStudent(studentId),
        ReflectionService.getReflectionsByStudent(studentId),
        PairProgrammingService.getRequestsByStudent(studentId)
      ]);

      setStudent(studentData);
      setGoals(goalsData);
      setReflections(reflectionsData);
      setPairRequests(pairRequestsData);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId, loadStudentData]);

  const handleReviewGoal = async (goalId: string, status: 'approved' | 'reviewed') => {
    try {
      await GoalService.reviewGoal(goalId, 'current-mentor-id', status);
      // Refresh goals
      const updatedGoals = await GoalService.getGoalsByStudent(studentId!);
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error reviewing goal:', error);
    }
  };

  const handleReviewReflection = async (
    reflectionId: string, 
    status: 'approved' | 'reviewed',
    mentorNotes?: string
  ) => {
    try {
      await ReflectionService.reviewReflection(reflectionId, 'current-mentor-id', status, mentorNotes);
      // Refresh reflections
      const updatedReflections = await ReflectionService.getReflectionsByStudent(studentId!);
      setReflections(updatedReflections);
    } catch (error) {
      console.error('Error reviewing reflection:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'reviewed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Student not found</h2>
          <button
            onClick={() => navigate('/mentor/dashboard')}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/mentor/dashboard')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                <p className="mt-1 text-gray-600">Mentee Review Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Overview */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Student Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{goals.length}</div>
                <div className="text-sm text-gray-500">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reflections.length}</div>
                <div className="text-sm text-gray-500">Total Reflections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{pairRequests.length}</div>
                <div className="text-sm text-gray-500">Pair Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {goals.filter(g => g.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">Pending Reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('goals')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'goals'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="inline h-4 w-4 mr-2" />
                Goals ({goals.length})
              </button>
              <button
                onClick={() => setActiveTab('reflections')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'reflections'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="inline h-4 w-4 mr-2" />
                Reflections ({reflections.length})
              </button>
              <button
                onClick={() => setActiveTab('pairs')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'pairs'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Code className="inline h-4 w-4 mr-2" />
                Pair Programming ({pairRequests.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                            {goal.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(goal.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-2">{goal.goal_text}</p>
                        <div className="text-sm text-gray-600">
                          Target: {goal.target_percentage}%
                        </div>
                      </div>
                      {goal.status === 'pending' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleReviewGoal(goal.id, 'approved')}
                            className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                          >
                            <CheckCircle className="inline h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewGoal(goal.id, 'reviewed')}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                          >
                            <Clock className="inline h-4 w-4 mr-1" />
                            Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {goals.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No goals yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This student hasn't submitted any goals yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reflections Tab */}
            {activeTab === 'reflections' && (
              <div className="space-y-4">
                {reflections.map((reflection) => (
                  <div key={reflection.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reflection.status)}`}>
                            {reflection.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(reflection.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-3 text-sm text-gray-900">
                          <div>
                            <p className="font-medium text-gray-700">What worked well:</p>
                            <p>{reflection.reflection_answers.workedWell}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">How achieved:</p>
                            <p>{reflection.reflection_answers.howAchieved}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Key learning:</p>
                            <p>{reflection.reflection_answers.keyLearning}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Challenges:</p>
                            <p>{reflection.reflection_answers.challenges}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Achieved: {reflection.achieved_percentage}%
                        </div>
                        {reflection.mentor_notes && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-sm text-blue-800">
                              <MessageSquare className="inline h-4 w-4 mr-1" />
                              Mentor Notes: {reflection.mentor_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      {reflection.status === 'pending' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleReviewReflection(reflection.id, 'approved')}
                            className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                          >
                            <CheckCircle className="inline h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewReflection(reflection.id, 'reviewed', 'Needs improvement')}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                          >
                            <Clock className="inline h-4 w-4 mr-1" />
                            Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {reflections.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reflections yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This student hasn't submitted any reflections yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pair Programming Tab */}
            {activeTab === 'pairs' && (
              <div className="space-y-4">
                {pairRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{request.topic}</h4>
                        {request.description && (
                          <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                        )}
                        {request.feedback && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="text-sm text-green-800">
                              <MessageSquare className="inline h-4 w-4 mr-1" />
                              Session Feedback: {request.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {pairRequests.length === 0 && (
                  <div className="text-center py-8">
                    <Code className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pair programming requests</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This student hasn't requested any pair programming sessions yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenteeReview;