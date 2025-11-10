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
  MenteeReviewService,
  MentorReviewService
} from '../../services/dataServices';
import { UserService } from '../../services/firestore';
import MentorBrowser from './MentorBrowser';
import ReviewActionsCard from '../Common/ReviewActionsCard';
import ReviewDeadlineEnforcement from './ReviewDeadlineEnforcement';
import { 
  DailyGoal, 
  DailyReflection, 
  User,
  MentorReviewForm
} from '../../types';
import { calculateReviewScore } from '../../utils/reviewCalculations';
import { getCurrentWeekStart } from '../../utils/reviewDateUtils';
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
  const [reviewerData, setReviewerData] = useState<User | null>(null); // The person who reviewed you
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [showMentorBrowser, setShowMentorBrowser] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMentorReviewModal, setShowMentorReviewModal] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [mentorReview, setMentorReview] = useState<MentorReviewForm>({
    morningExercise: 0,
    communication: 0,
    academicEffort: 0,
    campusContribution: 0,
    behavioural: 0,
    mentorshipLevel: 0,
    notes: ''
  });
  const [submittingMentorReview, setSubmittingMentorReview] = useState(false);
  const [hasSubmittedMentorReviewThisWeek, setHasSubmittedMentorReviewThisWeek] = useState(false);
  
  // If user is also a mentor, store their mentees
  const [myMentees, setMyMentees] = useState<User[]>([]);
  const [menteeReviews, setMenteeReviews] = useState<Map<string, any>>(new Map());

  // Modal functionality for mentee review (mentor -> student)
  const { modalRef, contentRef, handleOutsideClick, handleContentClick } = useModal(
    showReviewModal,
    () => setShowReviewModal(false)
  );

  // Modal functionality for mentor review (student -> mentor)
  const { 
    modalRef: mentorReviewModalRef, 
    contentRef: mentorReviewContentRef, 
    handleOutsideClick: handleMentorReviewOutsideClick, 
    handleContentClick: handleMentorReviewContentClick 
  } = useModal(
    showMentorReviewModal,
    () => setShowMentorReviewModal(false)
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

          // Calculate average score using centralized function
          // This correctly handles both MenteeReview (5 criteria) and MentorReview (6 criteria with mentorship_level)
          reviewScore = calculateReviewScore(latestReview);

          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const weeklyReviews = reviewHistory.filter(review => new Date(review.created_at) >= sevenDaysAgo);
          const monthlyReviews = reviewHistory.filter(review => new Date(review.created_at) >= thirtyDaysAgo);

          if (weeklyReviews.length > 0) {
            // Calculate weekly average using centralized function for consistency
            const weeklyTotal = weeklyReviews.reduce((sum, review) => {
              return sum + calculateReviewScore(review);
            }, 0);
            weeklyAvg = Math.round((weeklyTotal / weeklyReviews.length) * 10) / 10;
          }

          if (monthlyReviews.length > 0) {
            // Calculate monthly average using centralized function for consistency
            const monthlyTotal = monthlyReviews.reduce((sum, review) => {
              return sum + calculateReviewScore(review);
            }, 0);
            monthlyAvg = Math.round((monthlyTotal / monthlyReviews.length) * 10) / 10;
          }

          if (reviewHistory.length >= 2) {
            const sortedReviews = reviewHistory
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3);

            // Calculate trend using centralized function for consistency
            const recentAvg = sortedReviews.slice(0, 2).map(review => calculateReviewScore(review));

            if (recentAvg.length === 2) {
              const change = recentAvg[0] - recentAvg[1];
              if (change > 0.3) reviewTrend = 'improving';
              else if (change < -0.3) reviewTrend = 'declining';
              else reviewTrend = 'stable';
            }
          }
        }
        
        // Load reviewer information from the latest review
        if (latestReview && latestReview.mentor_id) {
          try {
            const reviewer = await UserService.getUserById(latestReview.mentor_id);
            setReviewerData(reviewer);
            console.log('👤 [StudentDashboard] Loaded reviewer:', reviewer?.name);
          } catch (error) {
            console.warn('⚠️ [StudentDashboard] Failed to load reviewer data:', error);
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
        
        // Check if student has submitted mentor review this week
        if (mentor && userData?.id) {
          const weekStart = getCurrentWeekStart();
          const hasSubmitted = await MentorReviewService.hasSubmittedThisWeek(
            mentor.id,      // mentor_id (first parameter)
            userData.id,    // student_id (second parameter)
            weekStart       // week_start (Monday midnight)
          );
          setHasSubmittedMentorReviewThisWeek(hasSubmitted);
          console.log(`✅ [StudentDashboard] Mentor review submitted this week: ${hasSubmitted}`);
        }
      } catch (error) {
        console.error('Error loading mentor data:', error);
      } finally {
        setLoadingMentor(false);
      }
    };

    loadMentor();
  }, [userData?.mentor_id, userData?.id]);

  // Load mentees if this user is also a mentor
  useEffect(() => {
    const loadMentees = async () => {
      if (!userData?.id || !userData?.isMentor) return;

      try {
        console.log('👥 [StudentDashboard] User is also a mentor, loading mentees...');
        const mentees = await UserService.getStudentsByMentor(userData.id);
        setMyMentees(mentees);

        // Load latest review for each mentee
        const reviewsMap = new Map();
        await Promise.all(
          mentees.map(async (mentee: User) => {
            const review = await MenteeReviewService.getLatestReview(mentee.id).catch(() => null);
            if (review) {
              reviewsMap.set(mentee.id, {
                review,
                score: calculateReviewScore(review)
              });
            }
          })
        );
        setMenteeReviews(reviewsMap);
        console.log('👥 [StudentDashboard] Loaded', mentees.length, 'mentees with reviews');
      } catch (error) {
        console.error('Error loading mentees:', error);
      }
    };

    loadMentees();
  }, [userData?.id, userData?.isMentor]);

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

  const handleSubmitMentorReview = async () => {
    if (!userData || !mentorData) return;

    try {
      setSubmittingMentorReview(true);

      // Get current week start (Monday) - use centralized function to ensure consistency
      const weekStart = getCurrentWeekStart();

      await MentorReviewService.createReview({
        mentor_id: mentorData.id,
        student_id: userData.id,
        morning_exercise: mentorReview.morningExercise,
        communication: mentorReview.communication,
        academic_effort: mentorReview.academicEffort,
        campus_contribution: mentorReview.campusContribution,
        behavioural: mentorReview.behavioural,
        mentorship_level: mentorReview.mentorshipLevel,
        notes: mentorReview.notes,
        week_start: weekStart
      });

      // Reset form
      setMentorReview({
        morningExercise: 0,
        communication: 0,
        academicEffort: 0,
        campusContribution: 0,
        behavioural: 0,
        mentorshipLevel: 0,
        notes: ''
      });

      setShowMentorReviewModal(false);
      alert('Mentor review submitted successfully!');
    } catch (error) {
      console.error('Error submitting mentor review:', error);
      alert('Failed to submit mentor review. Please try again.');
    } finally {
      setSubmittingMentorReview(false);
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

      {/* Enhanced Review Deadline Enforcement */}
      {mentorData && (
        <ReviewDeadlineEnforcement
          hasSubmitted={hasSubmittedMentorReviewThisWeek}
          onReviewClick={() => setShowMentorReviewModal(true)}
          reviewType="mentor"
          revieweeName={mentorData.name}
        />
      )}

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
          className={`p-6 rounded-lg shadow-sm border border-gray-200 ${
            !stats.latestReview ? 'bg-yellow-50 border-yellow-300' :
            (stats.reviewScore ?? 0) >= 1.5 ? 'bg-green-50 border-green-300' :
            (stats.reviewScore ?? 0) >= 0.5 ? 'bg-blue-50 border-blue-300' :
            (stats.reviewScore ?? 0) >= -0.5 ? 'bg-yellow-50 border-yellow-300' :
            'bg-red-50 border-red-300'
          }`}
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              !stats.latestReview ? 'bg-yellow-100' :
              (stats.reviewScore ?? 0) >= 1.5 ? 'bg-green-100' :
              (stats.reviewScore ?? 0) >= 0.5 ? 'bg-blue-100' :
              (stats.reviewScore ?? 0) >= -0.5 ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <Star className={`h-6 w-6 ${
                !stats.latestReview ? 'text-yellow-600' :
                (stats.reviewScore ?? 0) >= 1.5 ? 'text-green-600' :
                (stats.reviewScore ?? 0) >= 0.5 ? 'text-blue-600' :
                (stats.reviewScore ?? 0) >= -0.5 ? 'text-yellow-600' :
                'text-red-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Performance Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.latestReview ? (stats.reviewScore ?? 0).toFixed(1) : 'N/A'}
              </p>
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

      {/* Quick Actions Grid - 1:2 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Actions Card (1 column) */}
        <ReviewActionsCard
          receivedReviews={(stats.reviewHistory || []).map((review) => ({
            id: review.id || `review-${review.created_at}`,
            name: mentorData?.name || 'Mentor',
            score: review.score || calculateReviewScore(review),
            review: review // Pass full review object for time-based calculations
          }))}
          receivedTitle="Your Performance"
          onViewReceivedDetails={(reviewerId) => {
            setSelectedReviewerId(reviewerId);
            setShowReviewModal(true);
          }}
          toReviewUsers={[
            ...(mentorData ? [{
              id: mentorData.id,
              name: mentorData.name,
              score: null
            }] : []),
            ...myMentees.map(mentee => ({
              id: mentee.id,
              name: mentee.name,
              score: menteeReviews.get(mentee.id)?.score ?? null
            }))
          ]}
          toReviewTitle={myMentees.length > 0 ? "Review Mentor & Mentees" : "Review Your Mentor"}
          onSubmitReview={(userId) => {
            // Navigate to person's history page
            // The page will show their history and a "Review Now" button
            navigate(`/mentor/mentee/${userId}`);
          }}
        />

        {/* Book Session & My Mentor Cards (2 columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Book Session Card */}
          <div 
            onClick={() => navigate('/student/book-session')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Book Pair Session</h3>
            </div>
            <p className="text-green-100 text-sm mb-2">Schedule time with your mentor</p>
            <div className="text-right text-2xl">→</div>
          </div>

          {/* My Mentor Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">My Mentor</h3>
            </div>
            
            {loadingMentor ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : mentorData ? (
              <div className="mb-3">
                <p className="font-medium text-gray-900">{mentorData.name}</p>
                <p className="text-sm text-gray-600">{mentorData.email}</p>
                {hasPendingRequest && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                    Change pending
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic mb-3">No mentor assigned</p>
            )}
            
            {!loadingMentor && (
              <button
                onClick={() => setShowMentorBrowser(true)}
                disabled={hasPendingRequest}
                className={`w-full py-2 px-3 text-sm font-medium rounded transition-colors ${
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
      {showReviewModal && (
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Performance Review</h3>
                  {stats.latestReview && (
                    <p className="text-sm text-gray-600 mt-1">
                      Reviewed by: <span className="font-medium text-blue-600">
                        {reviewerData?.name || mentorData?.name || 'Your Mentor'}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {stats.latestReview ? (
                <>
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
                  { key: 'behavioural', label: 'Behavioral', value: stats.latestReview.behavioural, icon: '⭐' },
                  // Add mentorship_level if it exists (for MentorReviews)
                  ...(stats.latestReview.mentorship_level !== undefined ? [
                    { key: 'mentorship_level', label: 'Mentorship Level', value: stats.latestReview.mentorship_level, icon: '🎓' }
                  ] : [])
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
                  <p className="text-3xl font-bold text-gray-900">{(stats.reviewScore ?? 0).toFixed(1)}/2</p>
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
                  <p className="text-2xl font-bold text-gray-900">{(stats.weeklyAvg || stats.reviewScore || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Scale: -2 to +2</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">30-Day Average</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats.monthlyAvg || stats.reviewScore || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Scale: -2 to +2</p>
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
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Review Yet</h3>
                  <p className="text-gray-500 mb-4">Your mentor hasn't submitted a performance review yet.</p>
                  <p className="text-sm text-gray-400">Check back later for feedback and guidance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mentor Review Modal (Student reviews Mentor) */}
      {showMentorReviewModal && mentorData && (
        <div
          ref={mentorReviewModalRef}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleMentorReviewOutsideClick}
        >
          <div
            ref={mentorReviewContentRef}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={handleMentorReviewContentClick}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Star className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Review Your Mentor</h3>
              </div>
              <button
                onClick={() => setShowMentorReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close review modal"
              >
                <AlertCircle className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <span className="font-medium">Reviewing:</span> {mentorData.name}
              </p>
            </div>

            <div className="space-y-6">
              {/* Morning Exercise */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏃 Morning Exercise
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={mentorReview.morningExercise}
                  onChange={(e) => setMentorReview(prev => ({ ...prev, morningExercise: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-2</span>
                  <span>0</span>
                  <span>+2</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  mentorReview.morningExercise >= 1 ? 'bg-green-100 text-green-800' :
                  mentorReview.morningExercise <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {mentorReview.morningExercise}
                </div>
              </div>

              {/* Communication */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💬 Communication
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={mentorReview.communication}
                  onChange={(e) => setMentorReview(prev => ({ ...prev, communication: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-2</span>
                  <span>0</span>
                  <span>+2</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  mentorReview.communication >= 1 ? 'bg-green-100 text-green-800' :
                  mentorReview.communication <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {mentorReview.communication}
                </div>
              </div>

              {/* Academic Effort */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📚 Academic Effort
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={mentorReview.academicEffort}
                  onChange={(e) => setMentorReview(prev => ({ ...prev, academicEffort: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-2</span>
                  <span>0</span>
                  <span>+2</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  mentorReview.academicEffort >= 1 ? 'bg-green-100 text-green-800' :
                  mentorReview.academicEffort <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {mentorReview.academicEffort}
                </div>
              </div>

              {/* Campus Contribution */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🤝 Campus Contribution
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={mentorReview.campusContribution}
                  onChange={(e) => setMentorReview(prev => ({ ...prev, campusContribution: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-2</span>
                  <span>0</span>
                  <span>+2</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  mentorReview.campusContribution >= 1 ? 'bg-green-100 text-green-800' :
                  mentorReview.campusContribution <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {mentorReview.campusContribution}
                </div>
              </div>

              {/* Behavioral */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⭐ Behavioral
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={mentorReview.behavioural}
                  onChange={(e) => setMentorReview(prev => ({ ...prev, behavioural: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-2</span>
                  <span>0</span>
                  <span>+2</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  mentorReview.behavioural >= 1 ? 'bg-green-100 text-green-800' :
                  mentorReview.behavioural <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {mentorReview.behavioural}
                </div>
              </div>

              {/* Mentorship Level - THE ADDITIONAL SCALE */}
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  🎯 Mentorship Quality (Additional Scale)
                </label>
                <p className="text-xs text-purple-600 mb-3">Rate the quality of mentoring you received</p>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={mentorReview.mentorshipLevel}
                  onChange={(e) => setMentorReview(prev => ({ ...prev, mentorshipLevel: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-purple-600 mt-1">
                  <span>-2: Poor</span>
                  <span>0: Average</span>
                  <span>+2: Excellent</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  mentorReview.mentorshipLevel >= 1 ? 'bg-green-100 text-green-800' :
                  mentorReview.mentorshipLevel <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {mentorReview.mentorshipLevel}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={mentorReview.notes}
                  onChange={(e) => setMentorReview(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Share any additional feedback or comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMentorReviewModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMentorReview}
                disabled={submittingMentorReview}
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submittingMentorReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;