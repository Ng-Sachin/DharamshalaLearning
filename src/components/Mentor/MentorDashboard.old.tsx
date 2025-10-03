import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/firestore';
import { GoalService, ReflectionService, PairProgrammingService } from '../../services/dataServices';
import { User, DailyGoal, DailyReflection, PairProgrammingRequest } from '../../types';
import { 
  Users, 
  Target, 
  BookOpen, 
  Code, 
  Clock,
  CheckCircle
} from 'lucide-react';

interface MenteeStats {
  student: User;
  goalsThisWeek: number;
  reflectionsThisWeek: number;
  pendingApprovals: number;
  currentPhase: string;
  progressScore: number;
}

const MentorDashboard: React.FC = () => {
  const { userData } = useAuth();
  const [mentees, setMentees] = useState<User[]>([]);
  const [menteeStats, setMenteeStats] = useState<MenteeStats[]>([]);
  const [pendingGoals, setPendingGoals] = useState<DailyGoal[]>([]);
  const [pendingReflections, setPendingReflections] = useState<DailyReflection[]>([]);
  const [pairProgrammingRequests, setPairProgrammingRequests] = useState<PairProgrammingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMentorData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get mentees
      const menteesList = await UserService.getStudentsByMentor(userData!.id);
      setMentees(menteesList);

      // Get pending items for review
      const [goals, reflections, pairRequests] = await Promise.all([
        GoalService.getPendingGoalsForMentor(userData!.id),
        ReflectionService.getPendingReflectionsForMentor(userData!.id),
        PairProgrammingService.getRequestsByMentor(userData!.id)
      ]);

      setPendingGoals(goals);
      setPendingReflections(reflections);
      setPairProgrammingRequests(pairRequests);

      // Calculate stats for each mentee
      const stats = await Promise.all(
        menteesList.map(async (student: User) => {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);

          const [weeklyGoals, weeklyReflections] = await Promise.all([
            GoalService.getGoalsByStudent(student.id),
            ReflectionService.getReflectionsByStudent(student.id)
          ]);

          const pendingCount = goals.filter((g: DailyGoal) => g.student_id === student.id).length +
                              reflections.filter((r: DailyReflection) => r.student_id === student.id).length;

          return {
            student,
            goalsThisWeek: weeklyGoals.length,
            reflectionsThisWeek: weeklyReflections.length,
            pendingApprovals: pendingCount,
            currentPhase: 'Phase 1', // TODO: Get from student progress
            progressScore: Math.round((weeklyGoals.length + weeklyReflections.length) / 2 * 10)
          } as MenteeStats;
        })
      );

      setMenteeStats(stats);
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

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
            <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {userData?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Mentees</p>
                <p className="text-2xl font-semibold text-gray-900">{mentees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Goals</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingGoals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Reflections</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingReflections.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Code className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pair Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{pairProgrammingRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mentees Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Mentees</h2>
          </div>
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {menteeStats.map((stats) => (
                <div key={stats.student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {stats.student.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{stats.student.name}</h3>
                        <p className="text-sm text-gray-500">{stats.currentPhase}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(stats.progressScore)}`}>
                      {stats.progressScore}%
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">{stats.goalsThisWeek}</p>
                      <p className="text-xs text-gray-500">Goals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">{stats.reflectionsThisWeek}</p>
                      <p className="text-xs text-gray-500">Reflections</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-red-600">{stats.pendingApprovals}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button 
                      onClick={() => window.location.href = `/mentor/mentee/${stats.student.id}`}
                      className="flex-1 bg-primary-600 text-white text-sm py-2 px-3 rounded-md hover:bg-primary-700 transition-colors"
                    >
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 text-sm py-2 px-3 rounded-md hover:bg-gray-200 transition-colors">
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {menteeStats.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No mentees assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contact your administrator to get mentees assigned to you.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Pending Approvals</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[...pendingGoals.slice(0, 3), ...pendingReflections.slice(0, 3)].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      {'goal' in item ? (
                        <Target className="h-5 w-5 text-green-600" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-purple-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {'goal' in item ? 'Daily Goal' : 'Reflection'} - {item.student_id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Review
                    </button>
                  </div>
                ))}
              </div>
              
              {pendingGoals.length === 0 && pendingReflections.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                  <p className="mt-2 text-sm text-gray-500">All caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-6">
                <Clock className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Activity feed coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;