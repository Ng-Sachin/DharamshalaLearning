import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, MessageSquare, Target } from 'lucide-react';
import { DailyGoal, DailyReflection } from '../../types';
import { GoalService, ReflectionService } from '../../services/dataServices';

interface GoalReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DailyGoal | DailyReflection | null;
  type: 'goal' | 'reflection';
  onStatusUpdate: () => void;
}

const GoalReflectionModal: React.FC<GoalReflectionModalProps> = ({
  isOpen,
  onClose,
  item,
  type,
  onStatusUpdate
}) => {
  const [mentorComment, setMentorComment] = useState('');
  const [mentorAssessment, setMentorAssessment] = useState<'needs_improvement' | 'on_track' | 'exceeds_expectations'>('on_track');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item && type === 'reflection') {
      const reflection = item as DailyReflection;
      setMentorComment(reflection.mentor_notes || '');
      setMentorAssessment(reflection.mentor_assessment || 'on_track');
    } else if (item && type === 'goal') {
      const goal = item as DailyGoal;
      setMentorComment(goal.mentor_comment || '');
    }
  }, [item, type]);

  const handleApprove = async () => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      if (type === 'goal') {
        await GoalService.reviewGoal(item.id, 'admin', 'approved', mentorComment);
      } else {
        await ReflectionService.reviewReflection(item.id, 'admin', 'approved', mentorComment, mentorAssessment);
      }
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error approving item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      if (type === 'goal') {
        await GoalService.reviewGoal(item.id, 'admin', 'reviewed', mentorComment);
      } else {
        await ReflectionService.reviewReflection(item.id, 'admin', 'reviewed', mentorComment, mentorAssessment);
      }
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error rejecting item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  const isGoal = type === 'goal';
  const goal = isGoal ? (item as DailyGoal) : null;
  const reflection = !isGoal ? (item as DailyReflection) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          {isGoal ? (
            <Target className="h-6 w-6 text-green-600" />
          ) : (
            <MessageSquare className="h-6 w-6 text-purple-600" />
          )}
          <h2 className="text-xl font-bold text-gray-900">
            {isGoal ? 'Goal Review' : 'Reflection Review'}
          </h2>
        </div>

        <div className="space-y-4">
          {isGoal && goal && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Goal Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{goal.goal_text}</p>
                <div className="mt-2 text-sm text-gray-600">
                  Target: {goal.target_percentage}% | Status: {goal.status}
                </div>
              </div>
            </div>
          )}

          {reflection && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Reflection Details</h3>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">What worked well?</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{reflection.reflection_answers.workedWell}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">How did you achieve this?</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{reflection.reflection_answers.howAchieved}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-1">Key learning?</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{reflection.reflection_answers.keyLearning}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-1">Challenges faced?</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{reflection.reflection_answers.challenges}</p>
                </div>

                <div className="text-sm text-gray-600">
                  Achieved: {reflection.achieved_percentage}% | Status: {reflection.status}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Mentor Feedback</h3>
            <textarea
              value={mentorComment}
              onChange={(e) => setMentorComment(e.target.value)}
              placeholder="Add your feedback or comments..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
            />
          </div>

          {!isGoal && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Assessment</h3>
              <select
                value={mentorAssessment}
                onChange={(e) => setMentorAssessment(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="needs_improvement">Needs Improvement</option>
                <option value="on_track">On Track</option>
                <option value="exceeds_expectations">Exceeds Expectations</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleReject}
            disabled={isSubmitting}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <XCircle size={18} />
            <span>{isSubmitting ? 'Processing...' : 'Reject'}</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <CheckCircle size={18} />
            <span>{isSubmitting ? 'Processing...' : 'Approve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalReflectionModal;