import React, { useState } from 'react';
import { DailyGoal } from '../../types';
import { ReflectionService } from '../../services/dataServices';
import { MessageSquare, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface DailyReflectionFormProps {
  goal: DailyGoal;
  studentId: string;
  onSubmitSuccess?: () => void;
}

interface ReflectionAnswers {
  workedWell: string;
  howAchieved: string;
  keyLearning: string;
  challenges: string;
}

const DailyReflectionForm: React.FC<DailyReflectionFormProps> = ({ 
  goal, 
  studentId,
  onSubmitSuccess 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [achievedPercentage, setAchievedPercentage] = useState(goal.target_percentage);
  const [answers, setAnswers] = useState<ReflectionAnswers>({
    workedWell: '',
    howAchieved: '',
    keyLearning: '',
    challenges: ''
  });

  const handleInputChange = (field: keyof ReflectionAnswers, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    return (
      answers.workedWell.trim().length > 0 &&
      answers.howAchieved.trim().length > 0 &&
      answers.keyLearning.trim().length > 0 &&
      answers.challenges.trim().length > 0 &&
      achievedPercentage >= 0 &&
      achievedPercentage <= 100
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitError('Please fill in all fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('📝 [DailyReflection] Submitting reflection for goal:', goal.id);
      
      await ReflectionService.createReflection({
        student_id: studentId,
        goal_id: goal.id,
        phase_id: goal.phase_id,
        topic_id: goal.topic_id,
        reflection_answers: answers,
        achieved_percentage: achievedPercentage,
        status: 'pending'
      });

      console.log('✅ [DailyReflection] Reflection submitted successfully');
      setSubmitSuccess(true);
      setShowForm(false);
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setAnswers({
          workedWell: '',
          howAchieved: '',
          keyLearning: '',
          challenges: ''
        });
      }, 2000);

    } catch (error) {
      console.error('❌ [DailyReflection] Error submitting reflection:', error);
      setSubmitError('Failed to submit reflection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">Reflection Submitted!</h3>
            <p className="text-sm text-green-700">Your daily reflection has been recorded successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-5 w-5 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Daily Reflection</h3>
              <p className="text-sm text-gray-600">Reflect on your learning progress today</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Record My Reflection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <MessageSquare className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Daily Reflection</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Reference */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Today's Goal:</p>
          <p className="text-gray-900 font-medium">{goal.goal_text}</p>
          <p className="text-sm text-gray-500 mt-1">Target: {goal.target_percentage}%</p>
        </div>

        {/* Achievement Percentage */}
        <div>
          <label htmlFor="achievedPercentage" className="block text-sm font-medium text-gray-700 mb-2">
            How much did you achieve? (%)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="achievedPercentage"
              min="0"
              max="100"
              step="5"
              value={achievedPercentage}
              onChange={(e) => setAchievedPercentage(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-lg font-bold text-primary-600 min-w-[60px] text-right">
              {achievedPercentage}%
            </span>
          </div>
        </div>

        {/* Question 1 */}
        <div>
          <label htmlFor="workedWell" className="block text-sm font-medium text-gray-700 mb-2">
            1. What worked well for you today? What were you able to achieve? *
          </label>
          <textarea
            id="workedWell"
            rows={4}
            value={answers.workedWell}
            onChange={(e) => handleInputChange('workedWell', e.target.value)}
            placeholder="Describe what went well and what you accomplished..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Question 2 */}
        <div>
          <label htmlFor="howAchieved" className="block text-sm font-medium text-gray-700 mb-2">
            2. How did you achieve this, and who supported you? *
          </label>
          <textarea
            id="howAchieved"
            rows={4}
            value={answers.howAchieved}
            onChange={(e) => handleInputChange('howAchieved', e.target.value)}
            placeholder="Explain your approach and mention any support you received..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Question 3 */}
        <div>
          <label htmlFor="keyLearning" className="block text-sm font-medium text-gray-700 mb-2">
            3. What was your special learning from today's task? *
          </label>
          <textarea
            id="keyLearning"
            rows={4}
            value={answers.keyLearning}
            onChange={(e) => handleInputChange('keyLearning', e.target.value)}
            placeholder="Share your key takeaway or insight..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Question 4 */}
        <div>
          <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 mb-2">
            4. What challenges did you face, and what would you need to make it better? *
          </label>
          <textarea
            id="challenges"
            rows={4}
            value={answers.challenges}
            onChange={(e) => handleInputChange('challenges', e.target.value)}
            placeholder="Describe any difficulties and what could help improve..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !validateForm()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Reflection</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyReflectionForm;
