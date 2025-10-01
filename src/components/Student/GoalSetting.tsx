import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PhaseService, 
  TopicService, 
  GoalService 
} from '../../services/dataServices';
import { DataSeedingService } from '../../services/dataSeedingService';
import { Phase, Topic, DailyGoal, GoalFormData } from '../../types';
import { goalTemplates, achievementLevels } from '../../data/initialData';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Lightbulb, 
  BookOpen, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const GoalSetting: React.FC = () => {
  const { userData } = useAuth();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [todaysGoal, setTodaysGoal] = useState<DailyGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    phase_id: '',
    topic_id: '',
    goal_text: '',
    target_percentage: 80
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dataStatus, setDataStatus] = useState({ phasesCount: 0, topicsCount: 0, isSeeded: false });

  const loadInitialData = useCallback(async () => {
    if (!userData) return;

    try {
      // Check data status first
      const status = await DataSeedingService.getDataStatus();
      setDataStatus(status);

      // If no data exists, show option to seed
      if (!status.isSeeded) {
        setError('No learning phases found. Please initialize the curriculum data.');
        return;
      }

      const [phasesData, goalData] = await Promise.all([
        PhaseService.getAllPhases(),
        GoalService.getTodaysGoal(userData.id)
      ]);

      setPhases(phasesData);
      setTodaysGoal(goalData);

      // If there's already a goal for today, populate the form
      if (goalData) {
        setFormData({
          phase_id: goalData.phase_id,
          topic_id: goalData.topic_id,
          goal_text: goalData.goal_text,
          target_percentage: goalData.target_percentage
        });
        
        // Load the topic for templates
        if (goalData.topic_id) {
          const topic = await TopicService.getTopicById(goalData.topic_id);
          setSelectedTopic(topic);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data');
    }
  }, [userData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (formData.phase_id) {
      loadTopics(formData.phase_id);
    } else {
      setTopics([]);
      setFormData(prev => ({ ...prev, topic_id: '' }));
    }
  }, [formData.phase_id]);



  const loadTopics = async (phaseId: string) => {
    try {
      const topicsData = await TopicService.getTopicsByPhase(phaseId);
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      setError('');
      
      const success = await DataSeedingService.seedInitialData();
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        await loadInitialData(); // Reload data after seeding
      } else {
        setError('Failed to initialize curriculum data');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      setError('Failed to initialize curriculum data');
    } finally {
      setIsSeeding(false);
    }
  };

  const selectTemplate = (template: string) => {
    setFormData(prev => ({ ...prev, goal_text: template }));
    setShowTemplates(false);
  };

  const getAchievementLevel = (percentage: number) => {
    for (const [key, level] of Object.entries(achievementLevels)) {
      if (percentage >= level.range[0] && percentage <= level.range[1]) {
        return level;
      }
    }
    return achievementLevels.beginner;
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'target_percentage' ? Number(value) : value
    }));

    // If topic is selected, load topic details for templates
    if (name === 'topic_id' && value) {
      try {
        const topic = await TopicService.getTopicById(value);
        setSelectedTopic(topic);
      } catch (error) {
        console.error('Error loading topic details:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    if (!formData.phase_id || !formData.topic_id || !formData.goal_text.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (todaysGoal) {
        // Update existing goal
        await GoalService.updateGoal(todaysGoal.id, {
          phase_id: formData.phase_id,
          topic_id: formData.topic_id,
          goal_text: formData.goal_text.trim(),
          target_percentage: formData.target_percentage,
          status: 'pending'
        });
      } else {
        // Create new goal
        await GoalService.createGoal({
          student_id: userData.id,
          phase_id: formData.phase_id,
          topic_id: formData.topic_id,
          goal_text: formData.goal_text.trim(),
          target_percentage: formData.target_percentage,
          status: 'pending',
          created_at: new Date()
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload today's goal
      const updatedGoal = await GoalService.getTodaysGoal(userData.id);
      setTodaysGoal(updatedGoal);
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = todaysGoal?.status === 'approved' || todaysGoal?.status === 'reviewed';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {todaysGoal ? 'Update Today\'s Goal' : 'Set Today\'s Goal'}
              </h1>
              <p className="text-sm text-gray-500">
                Define your learning objective and target achievement for today
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Goal saved successfully! Your mentor will review it soon.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                {!dataStatus.isSeeded && (
                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    {isSeeding ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4" />
                        <span>Initialize Curriculum</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {dataStatus.isSeeded && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Curriculum loaded: {dataStatus.phasesCount} phases, {dataStatus.topicsCount} topics</span>
                </div>
              </div>
            </div>
          )}

          {todaysGoal?.status === 'approved' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Your goal has been approved by your mentor and cannot be modified.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phase_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Phase <span className="text-red-500">*</span>
                </label>
                <select
                  id="phase_id"
                  name="phase_id"
                  value={formData.phase_id}
                  onChange={handleInputChange}
                  disabled={isFormDisabled}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select a phase</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="topic_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic <span className="text-red-500">*</span>
                </label>
                <select
                  id="topic_id"
                  name="topic_id"
                  value={formData.topic_id}
                  onChange={handleInputChange}
                  disabled={!formData.phase_id || isFormDisabled}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="goal_text" className="block text-sm font-medium text-gray-700">
                  Goal Description <span className="text-red-500">*</span>
                </label>
                {selectedTopic && goalTemplates[selectedTopic.name] && (
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Goal Templates</span>
                    {showTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>
              
              {showTemplates && selectedTopic && goalTemplates[selectedTopic.name] && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Suggested goals for {selectedTopic.name}:</p>
                  <div className="space-y-2">
                    {goalTemplates[selectedTopic.name].map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectTemplate(template)}
                        className="block w-full text-left p-2 text-sm bg-white border border-yellow-300 rounded hover:bg-yellow-50 hover:border-yellow-400 transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                id="goal_text"
                name="goal_text"
                rows={4}
                value={formData.goal_text}
                onChange={handleInputChange}
                disabled={isFormDisabled}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Describe what you want to achieve today..."
              />
            </div>

            <div>
              <label htmlFor="target_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Achievement Percentage
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    id="target_percentage"
                    name="target_percentage"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.target_percentage}
                    onChange={handleInputChange}
                    disabled={isFormDisabled}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center space-x-2 min-w-0">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                    <span className="text-lg font-semibold text-primary-600">
                      {formData.target_percentage}%
                    </span>
                  </div>
                </div>
                
                {(() => {
                  const level = getAchievementLevel(formData.target_percentage);
                  const colorClasses = {
                    red: 'bg-red-50 border-red-200 text-red-700 text-red-600 bg-red-500',
                    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 text-yellow-600 bg-yellow-500',
                    blue: 'bg-blue-50 border-blue-200 text-blue-700 text-blue-600 bg-blue-500',
                    green: 'bg-green-50 border-green-200 text-green-700 text-green-600 bg-green-500'
                  };
                  return (
                    <div className={`p-2 rounded-md text-sm ${level.color === 'red' ? 'bg-red-50 border-red-200' : 
                      level.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 
                      level.color === 'blue' ? 'bg-blue-50 border-blue-200' : 
                      'bg-green-50 border-green-200'}`}>
                      <div className={`flex items-center space-x-2 ${level.color === 'red' ? 'text-red-700' : 
                        level.color === 'yellow' ? 'text-yellow-700' : 
                        level.color === 'blue' ? 'text-blue-700' : 
                        'text-green-700'}`}>
                        <div className={`w-3 h-3 rounded-full ${level.color === 'red' ? 'bg-red-500' : 
                          level.color === 'yellow' ? 'bg-yellow-500' : 
                          level.color === 'blue' ? 'bg-blue-500' : 
                          'bg-green-500'}`}></div>
                        <span className="font-medium">{level.label}</span>
                      </div>
                      <p className={`mt-1 ${level.color === 'red' ? 'text-red-600' : 
                        level.color === 'yellow' ? 'text-yellow-600' : 
                        level.color === 'blue' ? 'text-blue-600' : 
                        'text-green-600'}`}>{level.description}</p>
                    </div>
                  );
                })()}
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
                      <span>Saving...</span>
                    </div>
                  ) : (
                    todaysGoal ? 'Update Goal' : 'Set Goal'
                  )}
                </button>
              </div>
            )}
          </form>

          {todaysGoal && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Goal Status</p>
                  <p className={`text-sm font-semibold capitalize ${
                    todaysGoal.status === 'approved' ? 'text-green-600' : 
                    todaysGoal.status === 'reviewed' ? 'text-blue-600' : 
                    'text-yellow-600'
                  }`}>
                    {todaysGoal.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-500">
                    {new Date(todaysGoal.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalSetting;