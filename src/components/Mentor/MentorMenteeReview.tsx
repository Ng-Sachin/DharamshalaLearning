import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../hooks/useModal';
import { GoalService, ReflectionService, PhaseService, TopicService, MenteeReviewService, MentorReviewService } from '../../services/dataServices';
import { UserService } from '../../services/firestore';
import { User, DailyGoal, DailyReflection, Phase, Topic, MenteeReviewForm, MentorReviewForm } from '../../types';
import { getCurrentWeekStart } from '../../utils/reviewDateUtils';
import Toast from '../Common/Toast';
import { queryCache } from '../../utils/cache';
import { 
  ArrowLeft, 
  Target, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  CheckCircle, 
  Clock,
  AlertCircle,
  Star,
  Award,
  Send,
  X,
  Edit
} from 'lucide-react';

interface ReviewItem {
  goal: DailyGoal;
  reflection?: DailyReflection;
  phase?: Phase;
  topic?: Topic;
}

const MentorMenteeReview: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [student, setStudent] = useState<User | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Context detection: Is this person a mentor being reviewed?
  const [isReviewingMentor, setIsReviewingMentor] = useState(false);
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    mentorNotes: '',
    goalComment: '',
    assessment: '' as '' | 'needs_improvement' | 'on_track' | 'exceeds_expectations',
    goalStatus: '' as '' | 'approved' | 'reviewed',
    reflectionStatus: '' as '' | 'approved' | 'reviewed'
  });
  
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Modal functionality
  const { modalRef, contentRef, handleOutsideClick, handleContentClick } = useModal(
    showReviewModal,
    () => setShowReviewModal(false)
  );
  
  // Mentee review state
  const [menteeReview, setMenteeReview] = useState<MenteeReviewForm>({
    morningExercise: 0,
    communication: 0,
    academicEffort: 0,
    campusContribution: 0,
    behavioural: 0,
    notes: ''
  });
  
  // Mentor review state (6 fields)
  const [mentorReview, setMentorReview] = useState<MentorReviewForm>({
    morningExercise: 0,
    communication: 0,
    academicEffort: 0,
    campusContribution: 0,
    behavioural: 0,
    mentorshipLevel: 0,
    notes: ''
  });
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'approved'>('all');
  const [latestReview, setLatestReview] = useState<any>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!studentId) return;

      // Load student info
      const studentData = await UserService.getUserById(studentId);
      setStudent(studentData);

      // Detect context: Is this person a mentor being reviewed?
      // A person is a mentor if they have mentees (role includes 'mentor')
      const isMentor = studentData?.role === 'mentor' || false;
      setIsReviewingMentor(isMentor);
      console.log('🔍 [MentorMenteeReview] Context Detection:', {
        personId: studentId,
        personName: studentData?.name,
        isMentor,
        role: studentData?.role
      });

      // Load goals and reflections
      const [goals, reflections, phases] = await Promise.all([
        GoalService.getGoalsByStudent(studentId, 50),
        ReflectionService.getReflectionsByStudent(studentId),
        PhaseService.getAllPhases()
      ]);

      // Get all topics across all phases
      const topicsPromises = phases.map(phase => TopicService.getTopicsByPhase(phase.id));
      const topicsArrays = await Promise.all(topicsPromises);
      const topics = topicsArrays.flat();

      // Build review items with goal + reflection + phase + topic
      const items: ReviewItem[] = goals.map((goal: DailyGoal) => {
        const reflection = reflections.find((r: DailyReflection) => r.goal_id === goal.id);
        const phase = phases.find((p: Phase) => p.id === goal.phase_id);
        const topic = topics.find((t: Topic) => t.id === goal.topic_id);
        
        return {
          goal,
          reflection,
          phase,
          topic
        };
      });

      setReviewItems(items);

      // Load latest review (use appropriate service based on context)
      try {
        let review;
        if (isMentor && userData?.id) {
          // If reviewing a mentor, get mentor review submitted by current user
          review = await MentorReviewService.getLatestReview(studentId, userData.id);
        } else {
          // If reviewing a mentee, get mentee review
          review = await MenteeReviewService.getLatestReview(studentId);
        }
        setLatestReview(review);
      } catch (error) {
        console.error('Error loading latest review:', error);
        setLatestReview(null);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, userData?.id]);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId, loadStudentData]);

  const openFeedbackPanel = (item: ReviewItem) => {
    setSelectedItem(item);
    setShowFeedbackPanel(true);
    setFeedbackForm({
      mentorNotes: item.reflection?.mentor_notes || '',
      goalComment: item.goal.mentor_comment || '',
      assessment: item.reflection?.mentor_assessment || '',
      goalStatus: item.goal.status === 'pending' ? '' : item.goal.status,
      reflectionStatus: item.reflection ? (item.reflection.status === 'pending' ? '' : item.reflection.status) : ''
    });
    setShowFeedbackPanel(true);
  };

  const closeFeedbackPanel = () => {
    setShowFeedbackPanel(false);
    setSelectedItem(null);
    setFeedbackForm({
      mentorNotes: '',
      goalComment: '',
      assessment: '',
      goalStatus: '',
      reflectionStatus: ''
    });
  };

  const handleSubmitFeedback = async () => {
    if (!selectedItem || !userData) return;

    // Validation: Check if action is selected when goal is pending
    if (selectedItem.goal.status === 'pending' && !feedbackForm.goalStatus) {
      alert('Please select an action (Approve or Request Changes) for the goal.');
      return;
    }

    // Validation: Check if feedback is provided when requesting changes
    if (feedbackForm.goalStatus === 'reviewed' && !feedbackForm.goalComment?.trim()) {
      alert('Please provide feedback when requesting changes.');
      return;
    }

    // Validation: Check if reflection status is selected when reflection is pending
    if (selectedItem.reflection?.status === 'pending' && !feedbackForm.reflectionStatus) {
      alert('Please select an action for the reflection.');
      return;
    }

    try {
      setSubmitting(true);

      // Update goal status if changed
      if (feedbackForm.goalStatus && selectedItem.goal.status === 'pending') {
        await GoalService.reviewGoal(
          selectedItem.goal.id,
          userData.id,
          feedbackForm.goalStatus,
          feedbackForm.goalComment
        );
        
        // Invalidate cache for this student's goals
        queryCache.invalidate(`goals:student:${selectedItem.goal.student_id}`);
        queryCache.invalidate('all-users');
      }

      // Update reflection with feedback if exists
      if (selectedItem.reflection) {
        await ReflectionService.reviewReflection(
          selectedItem.reflection.id,
          userData.id,
          feedbackForm.reflectionStatus || 'reviewed',
          feedbackForm.mentorNotes,
          feedbackForm.assessment || undefined
        );
        
        // Invalidate cache for this student's reflections
        queryCache.invalidate(`reflections:student:${selectedItem.reflection.student_id}`);
        queryCache.invalidate('all-users');
      }

      // Optimistically update the UI
      setReviewItems(prev => prev.map(item => {
        if (item.goal.id === selectedItem.goal.id) {
          return {
            ...item,
            goal: {
              ...item.goal,
              status: feedbackForm.goalStatus || item.goal.status,
              mentor_comment: feedbackForm.goalComment || item.goal.mentor_comment,
              reviewed_by: userData.id,
              reviewed_at: new Date()
            },
            reflection: item.reflection ? {
              ...item.reflection,
              status: feedbackForm.reflectionStatus || item.reflection.status,
              mentor_notes: feedbackForm.mentorNotes || item.reflection.mentor_notes,
              mentor_assessment: feedbackForm.assessment || item.reflection.mentor_assessment,
              reviewed_by: userData.id,
              reviewed_at: new Date()
            } : undefined
          };
        }
        return item;
      }));

      // Show success message
      setToast({ 
        visible: true, 
        message: feedbackForm.goalStatus === 'approved' 
          ? '✅ Successfully approved!' 
          : '✅ Feedback submitted successfully!', 
        type: 'success' 
      });

      // Reload data in background (will fetch fresh data due to cache invalidation)
      setTimeout(() => {
        loadStudentData();
      }, 500);
      
      closeFeedbackPanel();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setToast({ 
        visible: true, 
        message: '❌ Failed to submit feedback. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMenteeReview = async () => {
    if (!student || !userData) return;

    try {
      setSubmitting(true);

      // Get current week start (Monday) - use centralized function to ensure consistency
      const weekStart = getCurrentWeekStart();

      // Close modal immediately before async operation
      setShowReviewModal(false);

      // Check if we're reviewing a mentor or a mentee
      if (isReviewingMentor) {
        // MENTOR REVIEW - 6 fields including mentorshipLevel
        const reviewData = {
          mentor_id: student.id, // The person being reviewed (mentor)
          student_id: userData.id, // The person submitting (their mentee)
          morning_exercise: mentorReview.morningExercise,
          communication: mentorReview.communication,
          academic_effort: mentorReview.academicEffort,
          campus_contribution: mentorReview.campusContribution,
          behavioural: mentorReview.behavioural,
          mentorship_level: mentorReview.mentorshipLevel, // Extra field for mentors
          notes: mentorReview.notes,
          week_start: weekStart
        };

        console.log('📝 [MentorMenteeReview] Submitting MENTOR review data:', reviewData);

        // Save to Firebase using MentorReviewService
        const savedReview = await MentorReviewService.createReview(reviewData);
        console.log('📝 [MentorMenteeReview] Mentor review saved:', savedReview);
        
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
        
        // Show success toast
        setToast({ visible: true, message: '✅ Mentor review submitted successfully!', type: 'success' });
        
        // Reload latest review data
        setTimeout(async () => {
          try {
            if (studentId && userData?.id) {
              const review = await MentorReviewService.getLatestReview(studentId, userData.id);
              setLatestReview(review);
            }
          } catch (error) {
            console.error('Error reloading latest mentor review:', error);
          }
        }, 1000);
      } else {
        // MENTEE REVIEW - 5 fields (original logic)
        const reviewData = {
          student_id: student.id,
          mentor_id: userData.id,
          morning_exercise: menteeReview.morningExercise,
          communication: menteeReview.communication,
          academic_effort: menteeReview.academicEffort,
          campus_contribution: menteeReview.campusContribution,
          behavioural: menteeReview.behavioural,
          notes: menteeReview.notes,
          week_start: weekStart
        };

        console.log('📝 [MentorMenteeReview] Submitting MENTEE review data:', reviewData);

        // Save to Firebase using MenteeReviewService
        const savedReview = await MenteeReviewService.createReview(reviewData);
        console.log('📝 [MentorMenteeReview] Mentee review saved:', savedReview);
        
        // Reset form
        setMenteeReview({
          morningExercise: 0,
          communication: 0,
          academicEffort: 0,
          campusContribution: 0,
          behavioural: 0,
          notes: ''
        });
        
        // Show success toast
        setToast({ visible: true, message: '✅ Mentee review submitted successfully!', type: 'success' });
        
        // Reload latest review data
        setTimeout(async () => {
          try {
            if (studentId) {
              const review = await MenteeReviewService.getLatestReview(studentId);
              setLatestReview(review);
            }
          } catch (error) {
            console.error('Error reloading latest review:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setToast({ visible: true, message: '❌ Failed to submit review. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'reviewed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAssessmentIcon = (assessment?: string) => {
    switch (assessment) {
      case 'exceeds_expectations': return <Star className="h-4 w-4 text-green-600" />;
      case 'on_track': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'needs_improvement': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getAssessmentLabel = (assessment?: string) => {
    switch (assessment) {
      case 'exceeds_expectations': return 'Exceeds Expectations';
      case 'on_track': return 'On Track';
      case 'needs_improvement': return 'Needs Improvement';
      default: return 'Not Assessed';
    }
  };

  const filteredItems = reviewItems.filter(item => {
    if (filterStatus === 'all') return true;
    return item.goal.status === filterStatus || item.reflection?.status === filterStatus;
  });

  const pendingCount = reviewItems.filter(item => 
    item.goal.status === 'pending' || item.reflection?.status === 'pending'
  ).length;

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
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/mentor/dashboard')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-primary-600">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
              </div>
              
              {pendingCount > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">
                    {pendingCount} Pending Review{pendingCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Prominent Review Now Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3 text-xl font-bold"
          >
            <Star className="h-8 w-8" />
            <span>Review {isReviewingMentor ? student.name : student.name} Now</span>
            <Award className="h-8 w-8" />
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            {isReviewingMentor 
              ? "Rate your mentor's performance across 6 criteria including mentorship quality" 
              : "Rate your mentee's performance across 5 key criteria"}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Goals</p>
                <p className="text-2xl font-bold text-gray-900">{reviewItems.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reflections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviewItems.filter(i => i.reflection).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Achievement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviewItems.filter(i => i.reflection).length > 0
                    ? Math.round(
                        reviewItems
                          .filter(i => i.reflection)
                          .reduce((sum, i) => sum + (i.reflection?.achieved_percentage || 0), 0) /
                          reviewItems.filter(i => i.reflection).length
                      )
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {isReviewingMentor ? 'Mentor Review' : 'Mentee Review'}
                  </p>
                  {latestReview ? (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-gray-900">Latest Review Scores</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Morning Exercise: <span className={`font-medium ${latestReview.morning_exercise >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latestReview.morning_exercise}</span></div>
                        <div>Communication: <span className={`font-medium ${latestReview.communication >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latestReview.communication}</span></div>
                        <div>Academic Effort: <span className={`font-medium ${latestReview.academic_effort >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latestReview.academic_effort}</span></div>
                        <div>Campus Contribution: <span className={`font-medium ${latestReview.campus_contribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latestReview.campus_contribution}</span></div>
                        <div className={latestReview.mentorship_level !== undefined ? '' : 'col-span-2'}>
                          Behavioural: <span className={`font-medium ${latestReview.behavioural >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latestReview.behavioural}</span>
                        </div>
                        {latestReview.mentorship_level !== undefined && (
                          <div>Mentorship Level: <span className={`font-medium ${latestReview.mentorship_level >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latestReview.mentorship_level}</span> ⭐</div>
                        )}
                      </div>
                      {latestReview.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{latestReview.notes}"</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">Weekly Assessment</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                title={isReviewingMentor ? "Review mentor performance" : "Review mentee performance"}
              >
                {latestReview ? 'Update Review' : (isReviewingMentor ? 'Review Mentor' : 'Review Mentee')}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 flex-wrap" aria-label="Tabs">
              {(['all', 'pending', 'reviewed', 'approved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filterStatus === status
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                      {reviewItems.filter(item => 
                        item.goal.status === status || item.reflection?.status === status
                      ).length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Review Items List */}
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Target className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No items to review</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {filterStatus === 'all' 
                    ? 'This student hasn\'t submitted any goals yet.'
                    : `No ${filterStatus} items found.`}
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div key={item.goal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Item Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between flex-wrap">
                    <div className="flex items-center flex-wrap space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 mb-3">
                          {new Date(item.goal.created_at).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      {item.phase && (
                        <span className="px-2 py-1 my-2 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                          {item.phase.name}
                        </span>
                      )}
                      {item.topic && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded mb-3">
                          {item.topic.name}
                        </span>
                      )}
                    </div>
                    {/* Show button only if goal OR reflection is not approved */}
                    {!(item.goal.status === 'approved' && (!item.reflection || item.reflection.status === 'approved')) && (
                      <button
                        onClick={() => openFeedbackPanel(item)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="text-sm font-medium">Review & Feedback</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Goal + Reflection Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                  {/* Goal Section */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Goal</h3>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.goal.status)}`}>
                        {item.goal.status}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Goal Statement:</p>
                        <p className="text-gray-900">{item.goal.goal_text}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Target Achievement</p>
                          <p className="text-lg font-semibold text-blue-600">{item.goal.target_percentage}%</p>
                        </div>
                        {item.goal.reviewed_by && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Reviewed</p>
                            <p className="text-xs text-gray-700">
                              {new Date(item.goal.reviewed_at!).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reflection Section */}
                  <div className="p-6 bg-gray-50">
                    {item.reflection ? (
                      <>
                        <div className="flex items-center flex-wrap justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Reflection</h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.reflection.mentor_assessment && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-white rounded border border-gray-200">
                                {getAssessmentIcon(item.reflection.mentor_assessment)}
                                <span className="text-xs font-medium text-gray-700">
                                  {getAssessmentLabel(item.reflection.mentor_assessment)}
                                </span>
                              </div>
                            )}
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.reflection.status)}`}>
                              {item.reflection.status}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">⭐ What worked well</p>
                            <p className="text-sm text-gray-900">{item.reflection.reflection_answers.workedWell}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🤝 How achieved</p>
                            <p className="text-sm text-gray-900">{item.reflection.reflection_answers.howAchieved}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">💡 Key learning</p>
                            <p className="text-sm text-gray-900">{item.reflection.reflection_answers.keyLearning}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🚀 Challenges</p>
                            <p className="text-sm text-gray-900">{item.reflection.reflection_answers.challenges}</p>
                          </div>

                          <div className="pt-3 border-t border-gray-300">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500">Actual Achievement</p>
                                <p className="text-lg font-semibold text-purple-600">{item.reflection.achieved_percentage}%</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Variance</p>
                                <p className={`text-lg font-semibold ${
                                  item.reflection.achieved_percentage >= item.goal.target_percentage
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                                }`}>
                                  {item.reflection.achieved_percentage >= item.goal.target_percentage ? '+' : ''}
                                  {item.reflection.achieved_percentage - item.goal.target_percentage}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {item.reflection.mentor_notes && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Your Previous Feedback</p>
                              <p className="text-sm text-blue-800">{item.reflection.mentor_notes}</p>
                              {item.reflection.feedback_given_at && (
                                <p className="text-xs text-blue-600 mt-2">
                                  Given on {new Date(item.reflection.feedback_given_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-500">No reflection submitted yet</p>
                        <p className="text-xs text-gray-400 mt-1">Student hasn't completed their evening reflection</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feedback Panel (Sliding from right) */}
      {showFeedbackPanel && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={closeFeedbackPanel}
          ></div>

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl flex flex-col">
            {/* Panel Header */}
            <div className="bg-primary-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Award className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">Review & Feedback</h2>
                </div>
                <button
                  onClick={closeFeedbackPanel}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-primary-100 mt-1">
                {new Date(selectedItem.goal.created_at).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Goal Target</p>
                    <p className="text-lg font-semibold text-blue-600">{selectedItem.goal.target_percentage}%</p>
                  </div>
                  {selectedItem.reflection && (
                    <div>
                      <p className="text-xs text-gray-500">Actual Achievement</p>
                      <p className="text-lg font-semibold text-purple-600">{selectedItem.reflection.achieved_percentage}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Goal Review */}
              {selectedItem.goal.status === 'pending' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Goal Action <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFeedbackForm({ ...feedbackForm, goalStatus: 'approved', goalComment: '' })}
                      className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                        feedbackForm.goalStatus === 'approved'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className={`h-5 w-5 ${feedbackForm.goalStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">✓ Approve Goal</p>
                        <p className="text-sm text-gray-500">Goal is clear and achievable</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setFeedbackForm({ ...feedbackForm, goalStatus: 'reviewed' })}
                      className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                        feedbackForm.goalStatus === 'reviewed'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <AlertCircle className={`h-5 w-5 ${feedbackForm.goalStatus === 'reviewed' ? 'text-yellow-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">⚠ Request Changes</p>
                        <p className="text-sm text-gray-500">Needs clarification or adjustment</p>
                      </div>
                    </button>
                  </div>
                  
                  {/* Goal Feedback Text - Only show when requesting changes */}
                  {feedbackForm.goalStatus === 'reviewed' && (
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Feedback for Student <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={feedbackForm.goalComment}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, goalComment: e.target.value })}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                          !feedbackForm.goalComment?.trim() ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Required: Explain what needs to be improved or changed..."
                      />
                      {!feedbackForm.goalComment?.trim() && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠ Feedback is required when requesting changes
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Goal Comment (visible for both approved and reviewed goals) */}
              {(feedbackForm.goalStatus === 'approved' || feedbackForm.goalStatus === 'reviewed') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Goal Comment <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={feedbackForm.goalComment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, goalComment: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add a comment about this goal (e.g., suggestions, encouragement, guidance)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This comment will be visible to the student alongside their goal
                  </p>
                </div>
              )}

              {/* Reflection Assessment (only if reflection exists) */}
              {selectedItem.reflection && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Performance Assessment <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setFeedbackForm({ ...feedbackForm, assessment: 'exceeds_expectations' })}
                        className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                          feedbackForm.assessment === 'exceeds_expectations'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${feedbackForm.assessment === 'exceeds_expectations' ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Exceeds Expectations</p>
                          <p className="text-sm text-gray-500">Outstanding work, going above and beyond</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setFeedbackForm({ ...feedbackForm, assessment: 'on_track' })}
                        className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                          feedbackForm.assessment === 'on_track'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <CheckCircle className={`h-5 w-5 ${feedbackForm.assessment === 'on_track' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">On Track</p>
                          <p className="text-sm text-gray-500">Meeting expectations, good progress</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setFeedbackForm({ ...feedbackForm, assessment: 'needs_improvement' })}
                        className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                          feedbackForm.assessment === 'needs_improvement'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-yellow-300'
                        }`}
                      >
                        <AlertCircle className={`h-5 w-5 ${feedbackForm.assessment === 'needs_improvement' ? 'text-yellow-600' : 'text-gray-400'}`} />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Needs Improvement</p>
                          <p className="text-sm text-gray-500">Requires additional support or effort</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Reflection Status */}
                  {selectedItem.reflection.status === 'pending' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Reflection Status <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setFeedbackForm({ ...feedbackForm, reflectionStatus: 'approved' })}
                          className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                            feedbackForm.reflectionStatus === 'approved'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <CheckCircle className={`h-5 w-5 ${feedbackForm.reflectionStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Approve Reflection</p>
                            <p className="text-sm text-gray-500">Thoughtful and complete reflection</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setFeedbackForm({ ...feedbackForm, reflectionStatus: 'reviewed' })}
                          className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                            feedbackForm.reflectionStatus === 'reviewed'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <Clock className={`h-5 w-5 ${feedbackForm.reflectionStatus === 'reviewed' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Mark as Reviewed</p>
                            <p className="text-sm text-gray-500">Needs more detail or clarity</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mentor Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Detailed Feedback
                    </label>
                    <textarea
                      value={feedbackForm.mentorNotes}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, mentorNotes: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Share constructive feedback, encouragement, and suggestions for improvement..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This feedback will be visible to the student on their dashboard
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={closeFeedbackPanel}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={
                    submitting || 
                    (selectedItem.goal.status === 'pending' && !feedbackForm.goalStatus) ||
                    (feedbackForm.goalStatus === 'reviewed' && !feedbackForm.goalComment?.trim()) ||
                    (selectedItem.reflection?.status === 'pending' && !feedbackForm.reflectionStatus)
                  }
                  className={`flex items-center space-x-2 px-6 py-2 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    feedbackForm.goalStatus === 'approved' || feedbackForm.reflectionStatus === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>
                        {feedbackForm.goalStatus === 'approved' || feedbackForm.reflectionStatus === 'approved' 
                          ? 'Approve' 
                          : 'Send Feedback'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentee Review Modal */}
      {showReviewModal && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleOutsideClick}
        >
          <div
            ref={contentRef}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={handleContentClick}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Star className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {isReviewingMentor ? 'Mentor Performance Review' : 'Mentee Performance Review'}
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close review modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Morning Exercise */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Morning Exercise
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (isReviewingMentor) {
                      setMentorReview(prev => ({ ...prev, morningExercise: value }));
                    } else {
                      setMenteeReview(prev => ({ ...prev, morningExercise: value }));
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={(isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) <= -1 ? 'font-semibold text-red-600' : ''}>-2: Needs to put in serious effort</span>
                  <span className={(isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) === 0 ? 'font-semibold text-yellow-600' : ''}>0: Has scope for improvement</span>
                  <span className={(isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) >= 1 ? 'font-semibold text-green-600' : ''}>+2: Showing great growth</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  (isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) >= 1 ? 'bg-green-100 text-green-800' :
                  (isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {(isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) === -2 ? 'Needs to put in serious effort' :
                   (isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) === -1 ? 'Needs consistent effort' :
                   (isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) === 0 ? 'Has scope for improvement' :
                   (isReviewingMentor ? mentorReview.morningExercise : menteeReview.morningExercise) === 1 ? 'Improving consistently' :
                   'Showing great growth'}
                </div>
              </div>

              {/* Communication */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Communication
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={isReviewingMentor ? mentorReview.communication : menteeReview.communication}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (isReviewingMentor) {
                      setMentorReview(prev => ({ ...prev, communication: value }));
                    } else {
                      setMenteeReview(prev => ({ ...prev, communication: value }));
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={(isReviewingMentor ? mentorReview.communication : menteeReview.communication) <= -1 ? 'font-semibold text-red-600' : ''}>-2: Needs to put in serious effort</span>
                  <span className={(isReviewingMentor ? mentorReview.communication : menteeReview.communication) === 0 ? 'font-semibold text-yellow-600' : ''}>0: Has scope for improvement</span>
                  <span className={(isReviewingMentor ? mentorReview.communication : menteeReview.communication) >= 1 ? 'font-semibold text-green-600' : ''}>+2: Showing great growth</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  (isReviewingMentor ? mentorReview.communication : menteeReview.communication) >= 1 ? 'bg-green-100 text-green-800' :
                  (isReviewingMentor ? mentorReview.communication : menteeReview.communication) <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {(isReviewingMentor ? mentorReview.communication : menteeReview.communication) === -2 ? 'Needs to put in serious effort' :
                   (isReviewingMentor ? mentorReview.communication : menteeReview.communication) === -1 ? 'Needs consistent effort' :
                   (isReviewingMentor ? mentorReview.communication : menteeReview.communication) === 0 ? 'Has scope for improvement' :
                   (isReviewingMentor ? mentorReview.communication : menteeReview.communication) === 1 ? 'Improving consistently' :
                   'Showing great growth'}
                </div>
              </div>

              {/* Academic Effort */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Academic Effort
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (isReviewingMentor) {
                      setMentorReview(prev => ({ ...prev, academicEffort: value }));
                    } else {
                      setMenteeReview(prev => ({ ...prev, academicEffort: value }));
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={(isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) <= -1 ? 'font-semibold text-red-600' : ''}>-2: Needs to put in serious effort</span>
                  <span className={(isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) === 0 ? 'font-semibold text-yellow-600' : ''}>0: Has scope for improvement</span>
                  <span className={(isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) >= 1 ? 'font-semibold text-green-600' : ''}>+2: Showing great growth</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  (isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) >= 1 ? 'bg-green-100 text-green-800' :
                  (isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {(isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) === -2 ? 'Needs to put in serious effort' :
                   (isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) === -1 ? 'Needs consistent effort' :
                   (isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) === 0 ? 'Has scope for improvement' :
                   (isReviewingMentor ? mentorReview.academicEffort : menteeReview.academicEffort) === 1 ? 'Improving consistently' :
                   'Showing great growth'}
                </div>
              </div>

              {/* Campus Contribution */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Campus Contribution
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (isReviewingMentor) {
                      setMentorReview(prev => ({ ...prev, campusContribution: value }));
                    } else {
                      setMenteeReview(prev => ({ ...prev, campusContribution: value }));
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={(isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) <= -1 ? 'font-semibold text-red-600' : ''}>-2: Needs to put in serious effort</span>
                  <span className={(isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) === 0 ? 'font-semibold text-yellow-600' : ''}>0: Has scope for improvement</span>
                  <span className={(isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) >= 1 ? 'font-semibold text-green-600' : ''}>+2: Showing great growth</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  (isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) >= 1 ? 'bg-green-100 text-green-800' :
                  (isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {(isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) === -2 ? 'Needs to put in serious effort' :
                   (isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) === -1 ? 'Needs consistent effort' :
                   (isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) === 0 ? 'Has scope for improvement' :
                   (isReviewingMentor ? mentorReview.campusContribution : menteeReview.campusContribution) === 1 ? 'Improving consistently' :
                   'Showing great growth'}
                </div>
              </div>

              {/* Behavioural */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Behavioural
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (isReviewingMentor) {
                      setMentorReview(prev => ({ ...prev, behavioural: value }));
                    } else {
                      setMenteeReview(prev => ({ ...prev, behavioural: value }));
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={(isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) <= -1 ? 'font-semibold text-red-600' : ''}>-2: Needs to put in serious effort</span>
                  <span className={(isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) === 0 ? 'font-semibold text-yellow-600' : ''}>0: Has scope for improvement</span>
                  <span className={(isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) >= 1 ? 'font-semibold text-green-600' : ''}>+2: Showing great growth</span>
                </div>
                <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                  (isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) >= 1 ? 'bg-green-100 text-green-800' :
                  (isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) <= -1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {(isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) === -2 ? 'Needs to put in serious effort' :
                   (isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) === -1 ? 'Needs consistent effort' :
                   (isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) === 0 ? 'Has scope for improvement' :
                   (isReviewingMentor ? mentorReview.behavioural : menteeReview.behavioural) === 1 ? 'Improving consistently' :
                   'Showing great growth'}
                </div>
              </div>

              {/* Mentorship Level - Only shown when reviewing a mentor */}
              {isReviewingMentor && (
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <label className="block text-sm font-medium text-purple-900 mb-3">
                    Mentorship Level ⭐
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    value={mentorReview.mentorshipLevel}
                    onChange={(e) => setMentorReview(prev => ({ ...prev, mentorshipLevel: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-purple-700 mt-1">
                    <span className={mentorReview.mentorshipLevel <= -1 ? 'font-semibold text-red-600' : ''}>-2: Not providing adequate support</span>
                    <span className={mentorReview.mentorshipLevel === 0 ? 'font-semibold text-yellow-600' : ''}>0: Meets basic expectations</span>
                    <span className={mentorReview.mentorshipLevel >= 1 ? 'font-semibold text-green-600' : ''}>+2: Exceptional mentor</span>
                  </div>
                  <div className={`text-center text-sm font-medium mt-2 px-3 py-1 rounded-full inline-block ${
                    mentorReview.mentorshipLevel >= 1 ? 'bg-green-100 text-green-800' :
                    mentorReview.mentorshipLevel <= -1 ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {mentorReview.mentorshipLevel === -2 ? 'Not providing adequate support' :
                     mentorReview.mentorshipLevel === -1 ? 'Needs to improve guidance' :
                     mentorReview.mentorshipLevel === 0 ? 'Meets basic expectations' :
                     mentorReview.mentorshipLevel === 1 ? 'Great mentor' :
                     'Exceptional mentor'}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Additional Notes
                </label>
                <textarea
                  value={isReviewingMentor ? mentorReview.notes : menteeReview.notes}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isReviewingMentor) {
                      setMentorReview(prev => ({ ...prev, notes: value }));
                    } else {
                      setMenteeReview(prev => ({ ...prev, notes: value }));
                    }
                  }}
                  placeholder="Add any additional comments or observations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMenteeReview}
                disabled={submitting}
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ visible: false, message: '', type: 'info' })}
      />
    </div>
  );
};

export default MentorMenteeReview;
