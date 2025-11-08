import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../hooks/useModal';
import { 
  GoalService, 
  ReflectionService, 
  AttendanceService,
  EnhancedPairProgrammingService,
  LeaveService,
  MentorshipService,
  MenteeReviewService
} from '../../services/dataServices';
import { UserService } from '../../services/firestore';
import MentorBrowser from './MentorBrowser';
import { 
  DailyGoal, 
  DailyReflection, 
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
  latestReview?: any;
  reviewScore?: number;
  reviewHistory?: any[];
  reviewTrend?: 'improving' | 'declining' | 'stable';
  weeklyAvg?: number;
  monthlyAvg?: number;
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
    averageAchievement: 0,
    latestReview: null,
    reviewScore: 0,
    reviewHistory: [],
    reviewTrend: 'stable',
    weeklyAvg: 0,
    monthlyAvg: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedReflection, setExpandedReflection] = useState(false);
  const [mentorData, setMentorData] = useState<User | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [showMentorBrowser, setShowMentorBrowser] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Modal functionality
  const { modalRef, contentRef, handleOutsideClick, handleContentClick } = useModal(
    showReviewModal,
    () => setShowReviewModal(false)
  );

  // Prevent duplicate loads in React StrictMode (dev) or rapid re-renders
  const loadingRef = useRef(false);
  const lastLoadedUserRef = useRef<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!userData) return;

    // Skip if already loading or same user loaded in this render tick
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      console.log('📊 [StudentDashboard] Loading dashboard data for user:', userData.id);

      // Fetch batching: goals, reflections, attendance, leaves, sessions, and reviews
      const [recentGoals, allReflections, attendanceRecords, leaves, pairProgrammingRequests, latestReviewMaybe] = await Promise.all([
        GoalService.getGoalsByStudent(userData.id, 10),
        ReflectionService.getReflectionsByStudent(userData.id),
        AttendanceService.getStudentAttendance(userData.id),
        LeaveService.getStudentLeaves(userData.id),
        EnhancedPairProgrammingService.getSessionsByUser(userData.id, 'mentee').catch(() => []),
        MenteeReviewService.getLatestReview(userData.id).catch(() => null)
      ]);

      // Today's goal and reflection (compute client-side from cached lists)
      console.log('🎯 [StudentDashboard] Computing today\'s goal from cached goals...');
      const todayGoal = await GoalService.getTodaysGoal(userData.id);
      const todayReflection = todayGoal
        ? (allReflections.find(r => (r as any).goal_id === todayGoal.id) || null)
        : null;

      // Average achievement from recent reflections (use single reflections list)
      const goalIds = new Set(recentGoals.map(g => g.id));
      const recentReflections = allReflections.filter(r => goalIds.has((r as any).goal_id));
      const averageAchievement = recentReflections.length > 0
        ? recentReflections.reduce((sum, r) => sum + (r as any).achieved_percentage, 0) / recentReflections.length
        : 0;

      // Pair programming sessions
      const completedSessions = Array.isArray(pairProgrammingRequests)
        ? pairProgrammingRequests.filter((req: any) => req.status === 'completed').length
        : 0;

      // Attendance (last 30 days)
      let monthlyAttendance = 0;
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentAttendance = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date as any);
          return recordDate >= thirtyDaysAgo;
        });
        const presentDays = recentAttendance.filter(record => record.present_status === 'present').length;
        monthlyAttendance = recentAttendance.length > 0 ? (presentDays / recentAttendance.length) * 100 : 0;
        console.log('📅 [StudentDashboard] Attendance loaded:', monthlyAttendance + '%');
      } catch (error) {
        console.warn('⚠️ [StudentDashboard] Failed to compute attendance:', error);
      }

      // Leaves (current year)
      let leaveDaysTaken = 0;
      try {
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
        console.warn('⚠️ [StudentDashboard] Failed to compute leaves:', error);
      }

      // Reviews
      let latestReview: any = latestReviewMaybe;
      let reviewScore = 0;
      let reviewHistory: any[] = [];
      let reviewTrend: 'improving' | 'declining' | 'stable' = 'stable';
      let weeklyAvg = 0;
      let monthlyAvg = 0;
      try {
        console.log('📊 [StudentDashboard] Loading review for user:', userData.id);
        if (latestReview) {
          reviewHistory = await MenteeReviewService.getReviewsByStudent(userData.id);
          console.log('📊 [StudentDashboard] Review history:', reviewHistory.length, 'reviews');

          const scores = [
            latestReview.morning_exercise,
            latestReview.communication,
            latestReview.academic_effort,
            latestReview.campus_contribution,
            latestReview.behavioural
          ];
          reviewScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const weeklyReviews = reviewHistory.filter(review => new Date(review.created_at) >= sevenDaysAgo);
          const monthlyReviews = reviewHistory.filter(review => new Date(review.created_at) >= thirtyDaysAgo);

          if (weeklyReviews.length > 0) {
            const weeklyTotal = weeklyReviews.reduce((sum, review) => {
              const scores = [
                review.morning_exercise,
                review.communication,
                review.academic_effort,
                review.campus_contribution,
                review.behavioural
              ];
              return sum + scores.reduce((s, score) => s + score, 0) / scores.length;
            }, 0);
            weeklyAvg = Math.round(weeklyTotal / weeklyReviews.length);
          }

          if (monthlyReviews.length > 0) {
            const monthlyTotal = monthlyReviews.reduce((sum, review) => {
              const scores = [
                review.morning_exercise,
                review.communication,
                review.academic_effort,
                review.campus_contribution,
                review.behavioural
              ];
              return sum + scores.reduce((s, score) => s + score, 0) / scores.length;
            }, 0);
            monthlyAvg = Math.round(monthlyTotal / monthlyReviews.length);
          }

          if (reviewHistory.length >= 2) {
            const sortedReviews = reviewHistory
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3);

            const recentAvg = sortedReviews.slice(0, 2).map(review => {
              const scores = [
                review.morning_exercise,
                review.communication,
                review.academic_effort,
                review.campus_contribution,
                review.behavioural
              ];
              return scores.reduce((sum, score) => sum + score, 0) / scores.length;
            });

            if (recentAvg.length === 2) {
              const change = recentAvg[0] - recentAvg[1];
              if (change > 0.3) reviewTrend = 'improving';
              else if (change < -0.3) reviewTrend = 'declining';
              else reviewTrend = 'stable';
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [StudentDashboard] Failed to load review data:', error);
      }

      const finalStats = {
        todayGoal,
        todayReflection,
        weeklyAttendance: monthlyAttendance, // Simplified
        monthlyAttendance: Math.round(monthlyAttendance),
        pairProgrammingSessions: completedSessions,
        leavesRemaining: Math.max(0, 12 - leaveDaysTaken),
        recentGoals,
        averageAchievement: Math.round(averageAchievement),
        latestReview,
        reviewScore,
        reviewHistory,
        reviewTrend,
        weeklyAvg,
        monthlyAvg
      };
      console.log('✅ [StudentDashboard] Final stats:', finalStats);
      setStats(finalStats);
      lastLoadedUserRef.current = userData.id;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [userData]);

  useEffect(() => {
    if (!userData) return;
    // Avoid duplicate run in StrictMode by ensuring a change in user or manual trigger
    if (lastLoadedUserRef.current === userData.id && loadingRef.current) return;
    loadDashboardData();
  }, [userData, loadDashboardData]);

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
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userData?.name}!</h1>
          <p className="text-gray-600">Here's your learning progress overview</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            loadDashboardData();
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Refresh dashboard data"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

        <div
          className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
            !stats.latestReview ? 'border-yellow-300 bg-yellow-50' : ''
          }`}
          onClick={() => setShowReviewModal(true)}
        >
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">Performance Review</p>
            {stats.latestReview ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{stats.reviewScore}/2</p>
                <div className={`inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full font-medium ${
                  (stats.reviewScore ?? 0) >= 1.5 ? 'bg-green-100 text-green-800' :
                  (stats.reviewScore ?? 0) >= 0.5 ? 'bg-blue-100 text-blue-800' :
                  (stats.reviewScore ?? 0) >= -0.5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {(stats.reviewScore ?? 0) >= 1.5 ? '🌟 Showing great growth' :
                   (stats.reviewScore ?? 0) >= 0.5 ? '📈 Improving consistently' :
                   (stats.reviewScore ?? 0) >= -0.5 ? '⚠️ Scope for improvement' :
                   (stats.reviewScore ?? 0) >= -1.5 ? '🔔 Needs consistent effort' :
                   '⚡ Needs serious effort'}
                </div>
                {stats.reviewTrend !== 'stable' && (
                  <div className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full ml-2 ${
                    stats.reviewTrend === 'improving' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {stats.reviewTrend === 'improving' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3 transform rotate-180" />
                    )}
                    <span className="capitalize">{stats.reviewTrend}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Click to view details</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold text-yellow-600">Pending</p>
                <p className="text-xs text-yellow-700">Awaiting mentor review</p>
                <p className="text-xs text-gray-500 mt-2">Click to request review</p>
              </div>
            )}
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

      {/* Quick Action: Book Session */}
      <div 
        onClick={() => navigate('/student/book-session')}
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Book a Pair Programming Session</h3>
              <p className="text-green-100 text-sm">Choose your mentor and pick an available time slot</p>
            </div>
          </div>
          <div className="text-2xl">→</div>
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
            <div className="ml-4 flex gap-2">
              <button
                onClick={() => navigate('/student/book-session')}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                title="Book a pair programming session"
              >
                📅 Book Session
              </button>
              <button
                onClick={() => setShowMentorBrowser(true)}
                disabled={hasPendingRequest}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  hasPendingRequest
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {mentorData ? 'Change Mentor' : 'Find Mentor'}
              </button>
            </div>
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
              {stats.recentGoals.slice(0, 3).map((goal) => (
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

      {/* Review Details Modal */}
      {showReviewModal && stats.latestReview && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleOutsideClick}
        >
          <div
            ref={contentRef}
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={handleContentClick}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Performance Review Details</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Latest Review Date */}
              <div className="mb-6 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">Latest Review:</span>{' '}
                  {new Date(stats.latestReview.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Category Ratings */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Category Ratings</h4>
                {[
                  { key: 'morning_exercise', label: 'Morning Exercise', value: stats.latestReview.morning_exercise, icon: '🏃' },
                  { key: 'communication', label: 'Communication', value: stats.latestReview.communication, icon: '💬' },
                  { key: 'academic_effort', label: 'Academic Effort', value: stats.latestReview.academic_effort, icon: '📚' },
                  { key: 'campus_contribution', label: 'Campus Contribution', value: stats.latestReview.campus_contribution, icon: '🤝' },
                  { key: 'behavioural', label: 'Behavioral', value: stats.latestReview.behavioural, icon: '⭐' }
                ].map((category) => {
                  const interpretation = 
                    category.value === 2 ? 'Showing great growth' :
                    category.value === 1 ? 'Improving consistently' :
                    category.value === 0 ? 'Has scope for improvement' :
                    category.value === -1 ? 'Needs consistent effort' :
                    'Needs to put in serious effort';
                  
                  const isPriority = category.value <= -1;
                  
                  return (
                    <div 
                      key={category.key} 
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isPriority ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{category.icon}</span>
                          <span className="font-medium text-gray-900">{category.label}</span>
                          {isPriority && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                              Focus Area
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-bold ${
                          category.value >= 1 ? 'bg-green-100 text-green-800' :
                          category.value >= 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {category.value > 0 ? '+' : ''}{category.value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            category.value >= 1 ? 'bg-green-500' :
                            category.value >= 0 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${((category.value + 2) / 4) * 100}%` }}
                        ></div>
                      </div>
                      <p className={`text-xs font-medium ${
                        category.value >= 1 ? 'text-green-700' :
                        category.value >= 0 ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {interpretation}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Overall Score */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6 border-2 border-purple-200">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">Overall Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.reviewScore ?? 0}/2</p>
                  <div className={`inline-flex items-center space-x-1 text-sm px-3 py-1.5 rounded-full font-medium mt-2 ${
                    (stats.reviewScore ?? 0) >= 1.5 ? 'bg-green-100 text-green-800' :
                    (stats.reviewScore ?? 0) >= 0.5 ? 'bg-blue-100 text-blue-800' :
                    (stats.reviewScore ?? 0) >= -0.5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stats.reviewScore !== undefined ? (
                      (stats.reviewScore ?? 0) >= 1.5 ? '🌟 Showing great growth!' :
                      (stats.reviewScore ?? 0) >= 0.5 ? '📈 Improving consistently' :
                      (stats.reviewScore ?? 0) >= -0.5 ? '⚠️ Has scope for improvement' :
                      (stats.reviewScore ?? 0) >= -1.5 ? '🔔 Needs consistent effort' :
                      '⚡ Needs to put in serious effort'
                    ) : 'Loading...'}
                  </div>
                </div>
              </div>

              {/* Weekly and Monthly Averages */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">7-Day Average</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.weeklyAvg || stats.reviewScore}/2</p>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">30-Day Average</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.monthlyAvg || stats.reviewScore}/2</p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
              </div>

              {/* Priority Areas to Focus */}
              {(() => {
                const priorityAreas = [
                  { key: 'morning_exercise', label: 'Morning Exercise', value: stats.latestReview.morning_exercise, icon: '🏃' },
                  { key: 'communication', label: 'Communication', value: stats.latestReview.communication, icon: '💬' },
                  { key: 'academic_effort', label: 'Academic Effort', value: stats.latestReview.academic_effort, icon: '📚' },
                  { key: 'campus_contribution', label: 'Campus Contribution', value: stats.latestReview.campus_contribution, icon: '🤝' },
                  { key: 'behavioural', label: 'Behavioral', value: stats.latestReview.behavioural, icon: '⭐' }
                ].filter(area => area.value <= -1);

                return priorityAreas.length > 0 ? (
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400 mb-6">
                    <p className="text-sm font-medium text-red-800 mb-3 flex items-center">
                      <span className="text-lg mr-2">🎯</span>
                      Priority Areas to Focus ({priorityAreas.length})
                    </p>
                    <ul className="space-y-2">
                      {priorityAreas.map(area => (
                        <li key={area.key} className="text-sm text-red-700 flex items-center">
                          <span className="mr-2">{area.icon}</span>
                          <span className="font-medium">{area.label}</span>
                          <span className="ml-auto text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">
                            {area.value === -2 ? 'Needs serious effort' : 'Needs consistent effort'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400 mb-6">
                    <p className="text-sm font-medium text-green-800 flex items-center">
                      <span className="text-lg mr-2">✨</span>
                      Great job! No critical areas. Keep up the good work!
                    </p>
                  </div>
                );
              })()}

              {/* Mentor Notes */}
              {stats.latestReview.notes && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-800 mb-2">💬 Mentor Notes</p>
                  <p className="text-sm text-blue-700 leading-relaxed">{stats.latestReview.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;