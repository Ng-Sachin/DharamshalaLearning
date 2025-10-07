import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  GoalService, 
  ReflectionService, 
  AttendanceService,
  PairProgrammingService,
  LeaveService,
  MentorshipService
} from '../../services/dataServices';
import { UserService } from '../../services/firestore';
import MentorBrowser from './MentorBrowser';
import { 
  DailyGoal, 
  DailyReflection, 
  Attendance, 
  PairProgrammingRequest,
  LeaveRequest,
  User
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
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  Star,
  UserCircle
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
  const navigate = useNavigate();
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
  const [expandedReflection, setExpandedReflection] = useState(false);
  const [mentorData, setMentorData] = useState<User | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [showMentorBrowser, setShowMentorBrowser] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    if (userData) {
      loadDashboardData();
    }
  }, [userData]);

  useEffect(() => {
    const loadMentor = async () => {
      if (!userData?.mentor_id) {
        setLoadingMentor(false);
        return;
      }

      try {
        const mentor = await UserService.getUserById(userData.mentor_id);
        setMentorData(mentor);
      } catch (error) {
        console.error('Error loading mentor data:', error);
      } finally {
        setLoadingMentor(false);
      }
    };

    loadMentor();
  }, [userData?.mentor_id]);

  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!userData?.id) return;

      try {
        const requests = await MentorshipService.getStudentMentorRequests(userData.id);
        const pending = requests.some(r => r.status === 'pending');
        setHasPendingRequest(pending);
      } catch (error) {
        console.error('Error checking pending requests:', error);
      }
    };

    checkPendingRequest();
  }, [userData?.id]);

  const loadDashboardData = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      console.log('📊 [StudentDashboard] Loading dashboard data for user:', userData.id);

      // Load today's goal and reflection
      console.log('🎯 [StudentDashboard] Fetching today\'s goal...');
      const todayGoal = await GoalService.getTodaysGoal(userData.id);
      console.log('🎯 [StudentDashboard] Today\'s goal result:', todayGoal);
      let todayReflection = null;
      
      if (todayGoal) {
        todayReflection = await ReflectionService.getReflectionByGoal(todayGoal.id);
      }

      // Load recent goals for achievement calculation
      console.log('📋 [StudentDashboard] Fetching recent goals...');
      const recentGoals = await GoalService.getGoalsByStudent(userData.id, 10);
      console.log('📋 [StudentDashboard] Recent goals count:', recentGoals.length, recentGoals);
      
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
      let completedSessions = 0;
      try {
        const pairProgrammingRequests = await PairProgrammingService.getRequestsByStudent(userData.id);
        completedSessions = pairProgrammingRequests.filter(req => req.status === 'completed').length;
        console.log('👥 [StudentDashboard] Pair programming sessions loaded:', completedSessions);
      } catch (error) {
        console.warn('⚠️ [StudentDashboard] Failed to load pair programming sessions:', error);
        // Continue with default value of 0
      }

      // Load attendance data (simplified calculation)
      let monthlyAttendance = 0;
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const attendanceRecords = await AttendanceService.getStudentAttendance(userData.id);
      
      const recentAttendance = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= thirtyDaysAgo;
      });

        const presentDays = recentAttendance.filter(record => record.present_status === 'present').length;
        monthlyAttendance = recentAttendance.length > 0 ? (presentDays / recentAttendance.length) * 100 : 0;
        console.log('📅 [StudentDashboard] Attendance loaded:', monthlyAttendance + '%');
      } catch (error) {
        console.warn('⚠️ [StudentDashboard] Failed to load attendance:', error);
        // Continue with default value of 0
      }

      // Load leaves
      let leaveDaysTaken = 0;
      try {
        const leaves = await LeaveService.getStudentLeaves(userData.id);
        const currentYear = new Date().getFullYear();
        const currentYearLeaves = leaves.filter(leave => 
          new Date(leave.start_date).getFullYear() === currentYear
        );
        
        leaveDaysTaken = currentYearLeaves.reduce((total, leave) => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return total + diffDays;
        }, 0);
        console.log('🏖️ [StudentDashboard] Leaves loaded, days taken:', leaveDaysTaken);
      } catch (error) {
        console.warn('⚠️ [StudentDashboard] Failed to load leaves:', error);
        // Continue with default value of 0
      }

      const finalStats = {
        todayGoal,
        todayReflection,
        weeklyAttendance: monthlyAttendance, // Simplified
        monthlyAttendance: Math.round(monthlyAttendance),
        pairProgrammingSessions: completedSessions,
        leavesRemaining: Math.max(0, 12 - leaveDaysTaken),
        recentGoals,
        averageAchievement: Math.round(averageAchievement)
      };
      console.log('✅ [StudentDashboard] Final stats:', finalStats);
      setStats(finalStats);
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

      {/* My Mentor Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Mentor</p>
              {loadingMentor ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : mentorData ? (
                <div>
                  <p className="text-lg font-bold text-gray-900">{mentorData.name}</p>
                  <p className="text-sm text-gray-600">{mentorData.email}</p>
                  {hasPendingRequest && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                      Change request pending
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No mentor assigned</p>
              )}
            </div>
          </div>
          
          {/* Change Mentor Button */}
          {!loadingMentor && (
            <button
              onClick={() => setShowMentorBrowser(true)}
              disabled={hasPendingRequest}
              className={`ml-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasPendingRequest
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {mentorData ? 'Change Mentor' : 'Find Mentor'}
            </button>
          )}
        </div>
      </div>

      {/* Mentor Browser Modal */}
      {showMentorBrowser && userData && (
        <MentorBrowser
          key={Date.now()} // Force remount to reload fresh data every time
          currentStudentId={userData.id}
          currentMentorId={userData.mentor_id}
          onClose={() => setShowMentorBrowser(false)}
          onRequestSubmitted={() => {
            setShowMentorBrowser(false);
            setHasPendingRequest(true);
          }}
        />
      )}

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
                
                {/* Mentor Comment */}
                {stats.todayGoal.mentor_comment && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Mentor Comment</p>
                        <p className="text-sm text-blue-800">{stats.todayGoal.mentor_comment}</p>
                      </div>
                    </div>
                  </div>
                )}
                
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
                <button 
                  onClick={() => navigate('/goal-setting')}
                  className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
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
                {/* Achievement Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Achievement</span>
                    <span className="text-lg font-bold text-primary-600">{stats.todayReflection.achieved_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.todayReflection.achieved_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Reflection Preview */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">⭐ What worked well</p>
                    <p className={`text-sm text-gray-900 ${!expandedReflection ? 'line-clamp-2' : ''}`}>
                      {stats.todayReflection.reflection_answers.workedWell}
                    </p>
                  </div>

                  {expandedReflection && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🤝 How I achieved this</p>
                        <p className="text-sm text-gray-900">{stats.todayReflection.reflection_answers.howAchieved}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">💡 Key learning</p>
                        <p className="text-sm text-gray-900">{stats.todayReflection.reflection_answers.keyLearning}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🚀 Challenges & improvements</p>
                        <p className="text-sm text-gray-900">{stats.todayReflection.reflection_answers.challenges}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setExpandedReflection(!expandedReflection)}
                  className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <span>{expandedReflection ? 'Show Less' : 'Show More'}</span>
                  {expandedReflection ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <div className="pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Submitted at {new Date(stats.todayReflection.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Mentor Feedback Section */}
                {stats.todayReflection.mentor_notes && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 bg-blue-100 rounded-full">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-blue-900">Mentor Feedback</p>
                          {stats.todayReflection.mentor_assessment && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              stats.todayReflection.mentor_assessment === 'exceeds_expectations' ? 'bg-green-100 text-green-700' :
                              stats.todayReflection.mentor_assessment === 'on_track' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {stats.todayReflection.mentor_assessment === 'exceeds_expectations' && <><Star className="h-3 w-3 inline mr-1" />Exceeds Expectations</>}
                              {stats.todayReflection.mentor_assessment === 'on_track' && <><CheckCircle className="h-3 w-3 inline mr-1" />On Track</>}
                              {stats.todayReflection.mentor_assessment === 'needs_improvement' && <><AlertCircle className="h-3 w-3 inline mr-1" />Needs Improvement</>}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-800">{stats.todayReflection.mentor_notes}</p>
                        {stats.todayReflection.feedback_given_at && (
                          <p className="text-xs text-blue-600 mt-2">
                            Reviewed on {new Date(stats.todayReflection.feedback_given_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Waiting for Feedback */}
                {!stats.todayReflection.mentor_notes && stats.todayReflection.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">Waiting for mentor review...</p>
                  </div>
                )}
              </div>
            ) : stats.todayGoal?.status === 'approved' ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No reflection submitted yet</p>
                <button 
                  onClick={() => navigate('/goal-setting')}
                  className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
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