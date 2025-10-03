import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/firestore';
import { GoalService, ReflectionService, PairProgrammingService } from '../../services/dataServices';
import { User, MenteeOverview } from '../../types';
import { 
  Users, 
  Target, 
  MessageSquare, 
  Code, 
  Bell,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [menteeOverviews, setMenteeOverviews] = useState<MenteeOverview[]>([]);
  const [totalPendingGoals, setTotalPendingGoals] = useState(0);
  const [totalPendingReflections, setTotalPendingReflections] = useState(0);
  const [totalPendingPairRequests, setTotalPendingPairRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMentorData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!userData?.id) {
        navigate('/dashboard');
        return;
      }

      // Get all mentees
      const mentees = await UserService.getStudentsByMentor(userData.id);
      
      let pendingGoalsCount = 0;
      let pendingReflectionsCount = 0;

      // Build overview for each mentee
      const overviews = await Promise.all(
        mentees.map(async (student: User): Promise<MenteeOverview> => {
          const [goals, reflections] = await Promise.all([
            GoalService.getGoalsByStudent(student.id, 30), // Last 30 goals
            ReflectionService.getReflectionsByStudent(student.id) // All reflections
          ]);

          const pendingGoals = goals.filter(g => g.status === 'pending').length;
          const pendingReflections = reflections.filter(r => r.status === 'pending').length;
          
          pendingGoalsCount += pendingGoals;
          pendingReflectionsCount += pendingReflections;

          const latestGoal = goals.length > 0 ? goals[0] : undefined;
          const latestReflection = reflections.length > 0 ? reflections[0] : undefined;

          // Calculate average achievement
          const reflectionsWithAchievement = reflections.filter(r => r.achieved_percentage);
          const avgAchievement = reflectionsWithAchievement.length > 0
            ? Math.round(
                reflectionsWithAchievement.reduce((sum, r) => sum + r.achieved_percentage, 0) / 
                reflectionsWithAchievement.length
              )
            : 0;

          return {
            student,
            pending_goals: pendingGoals,
            pending_reflections: pendingReflections,
            latest_goal: latestGoal,
            latest_reflection: latestReflection,
            average_achievement: avgAchievement,
            current_phase: latestGoal?.phase_id || undefined,
            current_topic: latestGoal?.topic_id || undefined
          };
        })
      );

      // Get pair programming requests
      const pairRequests = await PairProgrammingService.getRequestsByMentor(userData.id);
      const pendingPairs = pairRequests.filter(r => r.status === 'pending').length;

      setMenteeOverviews(overviews);
      setTotalPendingGoals(pendingGoalsCount);
      setTotalPendingReflections(pendingReflectionsCount);
      setTotalPendingPairRequests(pendingPairs);
    } catch (error) {
      console.error('Error loading mentor data:', error);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.id) {
      loadMentorData();
    }
  }, [userData, loadMentorData]);

  const getTotalPendingReviews = () => {
    return totalPendingGoals + totalPendingReflections;
  };

  const getAchievementColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
                <p className="mt-2 text-gray-600">Welcome back, {userData?.name}</p>
              </div>
              {getTotalPendingReviews() > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Bell className="h-5 w-5 text-yellow-600 animate-pulse" />
                  <span className="text-sm font-semibold text-yellow-800">
                    {getTotalPendingReviews()} Pending Review{getTotalPendingReviews() !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mentees</p>
                <p className="text-2xl font-bold text-gray-900">{menteeOverviews.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Goals to Review</p>
                <p className="text-2xl font-bold text-gray-900">{totalPendingGoals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reflections to Review</p>
                <p className="text-2xl font-bold text-gray-900">{totalPendingReflections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Code className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pair Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totalPendingPairRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mentees Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Mentees</h2>
        </div>

        {menteeOverviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <Users className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Mentees Yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                You don't have any mentees assigned yet. Check back later or contact an admin.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menteeOverviews.map((overview) => (
              <div
                key={overview.student.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/mentor/review/${overview.student.id}`)}
              >
                <div className="p-6">
                  {/* Header with notification badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-600">
                          {overview.student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {overview.student.name}
                        </h3>
                        <p className="text-sm text-gray-500">{overview.student.email}</p>
                      </div>
                    </div>
                    {(overview.pending_goals + overview.pending_reflections) > 0 && (
                      <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full">
                        <span className="text-sm font-bold text-white">
                          {overview.pending_goals + overview.pending_reflections}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Avg Achievement:</span>
                      <span className={`font-semibold px-2 py-1 rounded ${getAchievementColor(overview.average_achievement)}`}>
                        {overview.average_achievement}%
                      </span>
                    </div>

                    {overview.latest_goal && (
                      <div className="text-sm">
                        <p className="text-gray-600 mb-1">Latest Goal:</p>
                        <p className="text-gray-900 line-clamp-2">{overview.latest_goal.goal_text}</p>
                      </div>
                    )}
                  </div>

                  {/* Pending Items */}
                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                    {overview.pending_goals > 0 && (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">{overview.pending_goals} Goal{overview.pending_goals !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {overview.pending_reflections > 0 && (
                      <div className="flex items-center space-x-1 text-purple-600">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">{overview.pending_reflections} Reflection{overview.pending_reflections !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {overview.pending_goals === 0 && overview.pending_reflections === 0 && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">All caught up!</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                    <span className="text-sm font-medium">Review Progress</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {getTotalPendingReviews() > 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Action Required
                </h3>
                <p className="text-sm text-yellow-800 mb-4">
                  You have {getTotalPendingReviews()} pending item{getTotalPendingReviews() !== 1 ? 's' : ''} waiting for your review. 
                  Click on any mentee card above to start reviewing their work.
                </p>
                <div className="flex flex-wrap gap-2">
                  {totalPendingGoals > 0 && (
                    <div className="px-3 py-1 bg-yellow-100 rounded-full text-sm font-medium text-yellow-800">
                      {totalPendingGoals} Goal{totalPendingGoals !== 1 ? 's' : ''}
                    </div>
                  )}
                  {totalPendingReflections > 0 && (
                    <div className="px-3 py-1 bg-yellow-100 rounded-full text-sm font-medium text-yellow-800">
                      {totalPendingReflections} Reflection{totalPendingReflections !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
