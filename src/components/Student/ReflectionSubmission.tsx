import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  GoalService, 
  ReflectionService 
} from '../../services/dataServices';
import { DailyGoal, DailyReflection, ReflectionFormData } from '../../types';
import { MessageSquare, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const ReflectionSubmission: React.FC = () => {
  const { userData } = useAuth();
  const [todaysGoal, setTodaysGoal] = useState<DailyGoal | null>(null);
  const [existingReflection, setExistingReflection] = useState<DailyReflection | null>(null);
  const [formData, setFormData] = useState<ReflectionFormData>({
    reflection_text: '',
    achieved_percentage: 80
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodaysData();
  }, [userData]);

  const loadTodaysData = async () => {
    if (!userData) return;

    try {
      const goal = await GoalService.getTodaysGoal(userData.id);
      setTodaysGoal(goal);

      if (goal) {
        const reflection = await ReflectionService.getReflectionByGoal(goal.id);
        setExistingReflection(reflection);

        if (reflection) {
          setFormData({
            reflection_text: reflection.reflection_text,
            achieved_percentage: reflection.achieved_percentage
          });
        }
      }
    } catch (error) {
      console.error('Error loading today\'s data:', error);
      setError('Failed to load today\'s goal');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'achieved_percentage' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !todaysGoal) return;

    if (!formData.reflection_text.trim()) {
      setError('Please write a reflection');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (existingReflection) {
        // Update existing reflection
        await ReflectionService.updateReflection(existingReflection.id, {
          reflection_text: formData.reflection_text.trim(),
          achieved_percentage: formData.achieved_percentage,
          status: 'pending'
        });
      } else {
        // Create new reflection
        await ReflectionService.createReflection({
          student_id: userData.id,
          goal_id: todaysGoal.id,
          reflection_text: formData.reflection_text.trim(),
          achieved_percentage: formData.achieved_percentage,
          status: 'pending',
          created_at: new Date()
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload reflection data
      const updatedReflection = await ReflectionService.getReflectionByGoal(todaysGoal.id);
      setExistingReflection(updatedReflection);
    } catch (error) {
      console.error('Error saving reflection:', error);
      setError('Failed to save reflection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAchievementIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (percentage >= 70) return <TrendingUp className="h-5 w-5 text-blue-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const isFormDisabled = existingReflection?.status === 'approved' || existingReflection?.status === 'reviewed';

  if (!todaysGoal) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No goal set for today</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to set a goal first before you can submit a reflection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (todaysGoal.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Waiting for goal approval</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your mentor needs to review your goal before you can submit a reflection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {existingReflection ? 'Update Reflection' : 'Submit Evening Reflection'}
              </h1>
              <p className="text-sm text-gray-500">
                Reflect on your progress and achievements for today
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Today's Goal Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Today's Goal</h3>
            <p className="text-sm text-gray-900 mb-2">{todaysGoal.goal_text}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Target: {todaysGoal.target_percentage}%</span>
              <span className={`font-medium capitalize ${
                todaysGoal.status === 'approved' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {todaysGoal.status}
              </span>
            </div>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              Reflection submitted successfully! Your mentor will review it soon.
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {existingReflection?.status === 'approved' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Your reflection has been approved by your mentor and cannot be modified.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="reflection_text" className="block text-sm font-medium text-gray-700 mb-2">
                Reflection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reflection_text"
                name="reflection_text"
                rows={6}
                value={formData.reflection_text}
                onChange={handleInputChange}
                disabled={isFormDisabled}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Reflect on what you learned today, challenges you faced, and how you overcame them..."
              />
            </div>

            <div>
              <label htmlFor="achieved_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Percentage
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  id="achieved_percentage"
                  name="achieved_percentage"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.achieved_percentage}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex items-center space-x-2 min-w-0">
                  {getAchievementIcon(formData.achieved_percentage)}
                  <span className={`text-lg font-semibold ${getAchievementColor(formData.achieved_percentage)}`}>
                    {formData.achieved_percentage}%
                  </span>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Not started</span>
                <span>Partially done</span>
                <span>Mostly done</span>
                <span>Completed</span>
              </div>
            </div>

            {!isFormDisabled && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    existingReflection ? 'Update Reflection' : 'Submit Reflection'
                  )}
                </button>
              </div>
            )}
          </form>

          {existingReflection && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Reflection Status</p>
                  <p className={`text-sm font-semibold capitalize ${
                    existingReflection.status === 'approved' ? 'text-green-600' : 
                    existingReflection.status === 'reviewed' ? 'text-blue-600' : 
                    'text-yellow-600'
                  }`}>
                    {existingReflection.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Submitted</p>
                  <p className="text-sm text-gray-500">
                    {new Date(existingReflection.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {existingReflection.mentor_notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-1">Mentor Feedback</p>
                  <p className="text-sm text-blue-700">{existingReflection.mentor_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReflectionSubmission;