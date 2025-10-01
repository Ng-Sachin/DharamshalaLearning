import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  GoalService, 
  ReflectionService, 
  AttendanceService,
  PairProgrammingService,
  LeaveService
} from '../../services/dataServices';
import { 
  DailyGoal, 
  DailyReflection, 
  Attendance, 
  PairProgrammingRequest,
  LeaveRequest
} from '../../types';
import { 
  Target, 
  MessageSquare, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen
} from 'lucide-react';

interface DashboardStats {
  todayGoal: DailyGoal | null;
  todayReflection: DailyReflection | null;
  weeklyAttendance: number;
  monthlyAttendance: number;
  pairProgrammingSessions: number;
  leavesRemaining: number;
  recentGoals: DailyGoal[];
  averageAchievement: number;
}

const StudentDashboard: React.FC = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayGoal: null,
    todayReflection: null,
    weeklyAttendance: 0,
    monthlyAttendance: 0,
    pairProgrammingSessions: 0,
    leavesRemaining: 12, // Default leave balance
    recentGoals: [],
    averageAchievement: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      loadDashboardData();
    }
  }, [userData]);

  const loadDashboardData = async () => {
    if (!userData) return;

    try {
      setLoading(true);

      // Load today's goal and reflection
      const todayGoal = await GoalService.getTodaysGoal(userData.id);
      let todayReflection = null;
      
      if (todayGoal) {
        todayReflection = await ReflectionService.getReflectionByGoal(todayGoal.id);
      }

      // Load recent goals for achievement calculation
      const recentGoals = await GoalService.getGoalsByStudent(userData.id, 10);
      
      // Calculate average achievement from recent reflections
      const goalIds = recentGoals.map(goal => goal.id);
      const reflections: DailyReflection[] = [];
      
      for (const goalId of goalIds) {
        const reflection = await ReflectionService.getReflectionByGoal(goalId);
        if (reflection) {
          reflections.push(reflection);
        }
      }

      const averageAchievement = reflections.length > 0
        ? reflections.reduce((sum, r) => sum + r.achieved_percentage, 0) / reflections.length
        : 0;

      // Load pair programming sessions
      const pairProgrammingRequests = await PairProgrammingService.getRequestsByStudent(userData.id);
      const completedSessions = pairProgrammingRequests.filter(req => req.status === 'completed').length;

      // Load attendance data (simplified calculation)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const attendanceRecords = await AttendanceService.getStudentAttendance(userData.id);
      
      const recentAttendance = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= thirtyDaysAgo;
      });

      const presentDays = recentAttendance.filter(record => record.present_status === 'present').length;
      const monthlyAttendance = recentAttendance.length > 0 ? (presentDays / recentAttendance.length) * 100 : 0;

      // Load leaves
      const leaves = await LeaveService.getStudentLeaves(userData.id);
      const currentYear = new Date().getFullYear();
      const currentYearLeaves = leaves.filter(leave => 
        new Date(leave.start_date).getFullYear() === currentYear
      );
      
      const leaveDaysTaken = currentYearLeaves.reduce((total, leave) => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
      }, 0);

      setStats({
        todayGoal,
        todayReflection,
        weeklyAttendance: monthlyAttendance, // Simplified
        monthlyAttendance: Math.round(monthlyAttendance),
        pairProgrammingSessions: completedSessions,
        leavesRemaining: Math.max(0, 12 - leaveDaysTaken),
        recentGoals,
        averageAchievement: Math.round(averageAchievement)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userData?.name}!</h1>
        <p className="text-gray-600">Here's your learning progress overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Achievement</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageAchievement}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyAttendance}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pair Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pairProgrammingSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leaves Left</p>
              <p className="text-2xl font-bold text-gray-900">{stats.leavesRemaining}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Goals and Reflection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Goal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Today's Goal</h3>
              </div>
              {stats.todayGoal && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stats.todayGoal.status)}`}>
                  {stats.todayGoal.status}
                </span>
              )}
            </div>

            {stats.todayGoal ? (
              <div className="space-y-3">
                <p className="text-gray-700">{stats.todayGoal.goal_text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Target: {stats.todayGoal.target_percentage}%</span>
                  <span className="text-sm text-gray-500">
                    {new Date(stats.todayGoal.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No goal set for today</p>
                <button className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Set a goal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Today's Reflection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Today's Reflection</h3>
              </div>
              {stats.todayReflection && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stats.todayReflection.status)}`}>
                  {stats.todayReflection.status}
                </span>
              )}
            </div>

            {stats.todayReflection ? (
              <div className="space-y-3">
                <p className="text-gray-700 line-clamp-3">{stats.todayReflection.reflection_text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Achieved: {stats.todayReflection.achieved_percentage}%</span>
                  <span className="text-sm text-gray-500">
                    {new Date(stats.todayReflection.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {stats.todayReflection.mentor_notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Mentor Feedback</p>
                    <p className="text-sm text-blue-700">{stats.todayReflection.mentor_notes}</p>
                  </div>
                )}
              </div>
            ) : stats.todayGoal?.status === 'approved' ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No reflection submitted yet</p>
                <button className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Submit reflection
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  {stats.todayGoal ? 'Waiting for goal approval' : 'Set a goal first'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Goals Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Goals Progress</h3>
          
          {stats.recentGoals.length > 0 ? (
            <div className="space-y-4">
              {stats.recentGoals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {goal.goal_text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(goal.created_at).toLocaleDateString()} • Target: {goal.target_percentage}%
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                    {goal.status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : goal.status === 'reviewed' ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No goals set yet</p>
              <p className="text-xs text-gray-400">Start setting daily goals to track your progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;