import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PhaseService, 
  TopicService, 
  GoalService,
  ReflectionService
} from '../../services/dataServices';
import { DataSeedingService } from '../../services/dataSeedingService';
import { Phase, Topic, DailyGoal, DailyReflection, GoalFormData } from '../../types';
// Removed unused imports
import DailyReflectionForm from './DailyReflectionForm';
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit,
  MessageSquare
} from 'lucide-react';

const GoalSetting: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  // Core state
  const [phases, setPhases] = useState<Phase[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [todaysGoal, setTodaysGoal] = useState<DailyGoal | null>(null);
  const [todaysReflection, setTodaysReflection] = useState<DailyReflection | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    phase_id: '',
    topic_id: '',
    goal_text: '',
    target_percentage: 80
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dataStatus, setDataStatus] = useState({ 
    phasesCount: 0, 
    topicsCount: 0, 
    isSeeded: false 
  });

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!userData?.id) return;
    
    try {
      const [phasesData, goalData] = await Promise.all([
        PhaseService.getAllPhases(),
        GoalService.getTodaysGoal(userData.id)
      ]);

      setPhases(phasesData);
      setTodaysGoal(goalData);
      // Get topics count for all phases
      const topicsData = await Promise.all(phasesData.map(phase => TopicService.getTopicsByPhase(phase.id)));
      const totalTopics = topicsData.reduce((acc, topics) => acc + topics.length, 0);
      
      setDataStatus({
        phasesCount: phasesData.length,
        topicsCount: totalTopics,
        isSeeded: phasesData.length > 0
      });

      if (goalData) {
        const reflectionData = await ReflectionService.getReflectionByGoal(goalData.id);
        setTodaysReflection(reflectionData);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
    }
  }, [userData?.id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (formData.phase_id) {
      loadTopics(formData.phase_id);
    }
  }, [formData.phase_id]);

  // Load topics for selected phase
  const loadTopics = async (phaseId: string) => {
    try {
      const topicsData = await TopicService.getTopicsByPhase(phaseId);
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading topics:', error);
      setError('Failed to load topics');
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'target_percentage' ? Number(value) : value
    }));
  };

  // Handle goal form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const goalId = todaysGoal?.id;
      let result = true;
      
      if (goalId) {
        // Update existing goal
        await GoalService.updateGoal(goalId, {
          ...formData,
          status: 'pending'
        });
      } else {
        // Create new goal
        await GoalService.createGoal({
          ...formData,
          student_id: userData?.id || '',
          status: 'pending',
          created_at: new Date()
        });
      }
      
      if (result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        await loadInitialData();
        setIsEditing(false);
      } else {
        setError('Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reflection submission
  const handleReflectionSubmit = async () => {
    if (todaysGoal) {
      const reflectionData = await ReflectionService.getReflectionByGoal(todaysGoal.id);
      setTodaysReflection(reflectionData);
    }
  };

  // Handle data seeding
  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      setError('');
      
      const success = await DataSeedingService.seedInitialData();
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        await loadInitialData();
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

  // Render goal form
  const renderGoalForm = () => (
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
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
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
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
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
        <label htmlFor="goal_text" className="block text-sm font-medium text-gray-700 mb-2">
          Goal Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="goal_text"
          name="goal_text"
          rows={4}
          value={formData.goal_text}
          onChange={handleInputChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        ></textarea>
      </div>

      <div className="mt-2">
        <label htmlFor="target_percentage" className="block text-sm font-medium text-gray-700 mb-2">
          Target Achievement Level (%) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="target_percentage"
          name="target_percentage"
          min="0"
          max="100"
          value={formData.target_percentage}
          onChange={handleInputChange}
          className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Goal'}
        </button>
      </div>
    </form>
  );

  // Render goal card
  const renderGoalCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Today's Goal</h3>
          <p className="text-gray-600 mb-4">{todaysGoal?.goal_text}</p>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span>Target Achievement: {todaysGoal?.target_percentage}%</span>
          </div>
        </div>
        
        {todaysGoal?.status === 'pending' && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {todaysGoal?.status === 'reviewed' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Status:</h4>
          <p className="text-blue-800">Your goal has been reviewed by your mentor</p>
        </div>
      )}
    </div>
  );

  // Render reflection section
  const renderReflectionSection = () => (
    <div>
      {todaysGoal?.status === 'reviewed' && (
        <div className="mb-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Goal Status</h3>
          <p className="text-blue-800">Your goal has been reviewed and approved by your mentor</p>
        </div>
      )}
      
      {!todaysReflection ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Time to Reflect</h3>
          <p className="text-gray-600 mb-4">Your goal has been approved. Take a moment to reflect on your progress.</p>
          <DailyReflectionForm goal={todaysGoal!} studentId={userData?.id || ''} onSubmitSuccess={handleReflectionSubmit} />
        </div>
      ) : (
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Reflection Completed</h3>
          <p className="text-green-800">{todaysReflection.reflection_answers.workedWell}</p>
          <div className="mt-4 text-sm text-green-700">
            Achievement Level: {todaysReflection.achieved_percentage}%
          </div>
        </div>
      )}
    </div>
  );

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
                {isEditing ? 'Update Today\'s Goal' : 'Daily Learning Goal'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modify your learning objective for today' : 'Track and reflect on your daily progress'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status Messages */}
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

          {dataStatus.isSeeded && !todaysGoal && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Curriculum loaded: {dataStatus.phasesCount} phases, {dataStatus.topicsCount} topics</span>
              </div>
            </div>
          )}

          {/* Content based on state */}
          {(!todaysGoal || isEditing) && renderGoalForm()}
          {todaysGoal && !isEditing && (
            <>
              {renderGoalCard()}
              {todaysGoal.status === 'approved' && renderReflectionSection()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalSetting;