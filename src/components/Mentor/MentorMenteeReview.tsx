import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoalService, ReflectionService, PhaseService, TopicService } from '../../services/dataServices';
import { UserService } from '../../services/firestore';
import { User, DailyGoal, DailyReflection, Phase, Topic } from '../../types';
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
  Edit,
  Save
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
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    mentorNotes: '',
    assessment: '' as '' | 'needs_improvement' | 'on_track' | 'exceeds_expectations',
    goalStatus: '' as '' | 'approved' | 'reviewed',
    reflectionStatus: '' as '' | 'approved' | 'reviewed'
  });
  
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'approved'>('all');

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!studentId) return;

      // Load student info
      const studentData = await UserService.getUserById(studentId);
      setStudent(studentData);

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

  const openFeedbackPanel = (item: ReviewItem) => {
    setSelectedItem(item);
    setFeedbackForm({
      mentorNotes: item.reflection?.mentor_notes || '',
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
      assessment: '',
      goalStatus: '',
      reflectionStatus: ''
    });
  };

  const handleSubmitFeedback = async () => {
    if (!selectedItem || !userData) return;

    try {
      setSubmitting(true);

      // Update goal status if changed
      if (feedbackForm.goalStatus && selectedItem.goal.status === 'pending') {
        await GoalService.reviewGoal(
          selectedItem.goal.id,
          userData.id,
          feedbackForm.goalStatus
        );
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
      }

      // Reload data
      await loadStudentData();
      closeFeedbackPanel();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(item.goal.created_at).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      {item.phase && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                          {item.phase.name}
                        </span>
                      )}
                      {item.topic && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                          {item.topic.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openFeedbackPanel(item)}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-sm font-medium">Review & Feedback</span>
                    </button>
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
                        <div className="flex items-center justify-between mb-4">
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
                    Goal Status <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFeedbackForm({ ...feedbackForm, goalStatus: 'approved' })}
                      className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                        feedbackForm.goalStatus === 'approved'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className={`h-5 w-5 ${feedbackForm.goalStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Approve Goal</p>
                        <p className="text-sm text-gray-500">Goal is clear and achievable</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setFeedbackForm({ ...feedbackForm, goalStatus: 'reviewed' })}
                      className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                        feedbackForm.goalStatus === 'reviewed'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <Clock className={`h-5 w-5 ${feedbackForm.goalStatus === 'reviewed' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Mark as Reviewed</p>
                        <p className="text-sm text-gray-500">Needs clarification or adjustment</p>
                      </div>
                    </button>
                  </div>
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
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submitting || (!selectedItem.reflection && !feedbackForm.goalStatus)}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorMenteeReview;
