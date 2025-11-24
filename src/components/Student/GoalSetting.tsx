import React, { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Toast from '../Common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PhaseService, 
  TopicService
} from '../../services/dataServices';
import { FirestoreService, COLLECTIONS } from '../../services/firestore';
import { DataSeedingService } from '../../services/dataSeedingService';
import { Phase, Topic, DailyGoal, DailyReflection, GoalFormData } from '../../types';
import { getSmartFeedback } from '../../services/geminiClientApi';
import DailyReflectionForm from './DailyReflectionForm';
import { detailedTopics } from '../../data/initialData';
import { 
  Target,
  TrendingUp, 
  BookOpen, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit,
  MessageSquare,
  Lightbulb
} from 'lucide-react';

const GoalSetting: React.FC = () => {
  // const navigate = useNavigate();
  const { userData } = useAuth();
  
  // Core state
  const [phases, setPhases] = useState<Phase[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todaysGoal, setTodaysGoal] = useState<DailyGoal | null>(null);
  const [todaysReflection, setTodaysReflection] = useState<DailyReflection | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    phase_id: '',
    topic_id: '',
    goal_text: '',
    target_percentage: 80,
    goal_date: new Date()
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
  // SMART feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackHtml, setFeedbackHtml] = useState('');
  const [goalRating, setGoalRating] = useState<number | null>(null);
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Convert markdown to sanitized HTML using marked + DOMPurify
  const markdownToHtml = (md: string) => {
    if (!md) return '';
    const raw = marked.parse(md);
    // DOMPurify expects a DOM; in SSR contexts this can fail. This app runs in the browser.
    const clean = DOMPurify.sanitize(raw);
    return clean;
  };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!userData?.id) return;
    
    setIsLoading(true);
    try {
      const [phasesData] = await Promise.all([
        PhaseService.getAllPhases()
      ]);

      setPhases(phasesData);
      
      // Get today's goal - look for goals created today
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const todaysGoals = await FirestoreService.getWhere<DailyGoal>(
        COLLECTIONS.DAILY_GOALS,
        'student_id',
        '==',
        userData.id
      );
      
      // Filter for today's goals (client-side date filtering)
      const goalData = todaysGoals.find(goal => {
        const goalDate = goal.created_at instanceof Date ? goal.created_at : new Date(goal.created_at);
        return goalDate >= startOfDay && goalDate <= endOfDay;
      }) || null;
      
      setTodaysGoal(goalData);
      
      // Load existing feedback if goal exists
      if (goalData?.goal_feedback) {
        setFeedback(goalData.goal_feedback);
        const html = markdownToHtml(goalData.goal_feedback);
        setFeedbackHtml(html);
        
        // Parse rating from existing feedback if available
        const ratingMatch = goalData.goal_feedback.match(/\*\*INTERNAL RATING:\s*\[(\d+)\]\*\*/i);
        if (ratingMatch) {
          const rating = parseInt(ratingMatch[1], 10);
          if (rating >= 0 && rating <= 100) {
            setGoalRating(rating);
          }
        }
      }
      
      // Set curriculum status (topics will be loaded on-demand when phase is selected)
      setDataStatus({
        phasesCount: phasesData.length,
        topicsCount: 0, // Not needed - topics loaded per phase on-demand
        isSeeded: phasesData.length > 0
      });

      if (goalData) {
        const reflections = await FirestoreService.getWhere<DailyReflection>(
          COLLECTIONS.DAILY_REFLECTIONS,
          'goal_id',
          '==',
          goalData.id
        );
        const reflectionData = reflections[0] || null;
        setTodaysReflection(reflectionData);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
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

  // Keyboard handler for ESC to close feedback drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFeedback) {
        setShowFeedback(false);
      }
    };

    if (showFeedback) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFeedback]);

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
      [name]: name === 'target_percentage' ? Number(value) : 
              name === 'goal_date' ? new Date(value) : value
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
        // Update existing goal - only include fields that are defined
        const updateData: Partial<DailyGoal> = {
          ...formData,
          status: 'pending'
        };
        
        // Only include goal_rating if it's not null/undefined
        if (goalRating !== null && goalRating !== undefined) {
          updateData.goal_rating = goalRating;
        }
        
        // Only include goal_feedback if it's not null/undefined
        if (feedback !== null && feedback !== undefined && feedback.trim() !== '') {
          updateData.goal_feedback = feedback;
        }
        
        await FirestoreService.update<DailyGoal>(COLLECTIONS.DAILY_GOALS, goalId, updateData);
      } else {
        // Create new goal - only include fields that are defined
        const createData: Omit<DailyGoal, 'id' | 'created_at' | 'updated_at'> = {
          ...formData,
          student_id: userData?.id || '',
          status: 'pending'
        };
        
        // Only include goal_rating if it's not null/undefined
        if (goalRating !== null && goalRating !== undefined) {
          createData.goal_rating = goalRating;
        }
        
        // Only include goal_feedback if it's not null/undefined
        if (feedback !== null && feedback !== undefined && feedback.trim() !== '') {
          createData.goal_feedback = feedback;
        }
        
        await FirestoreService.create<DailyGoal>(COLLECTIONS.DAILY_GOALS, createData);
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
      const reflections = await FirestoreService.getWhere<DailyReflection>(
        COLLECTIONS.DAILY_REFLECTIONS,
        'goal_id',
        '==',
        todaysGoal.id
      );
      const reflectionData = reflections[0] || null;
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
        <label htmlFor="goal_date" className="block text-sm font-medium text-gray-700 mb-2">
          Goal Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="goal_date"
          name="goal_date"
          value={formData.goal_date ? formData.goal_date.toISOString().split('T')[0] : ''}
          onChange={handleInputChange}
          className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Select the date for this goal (defaults to today)</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Set Learning Goal</h3>
          <p className="text-gray-600 mb-4">{todaysGoal?.goal_text}</p>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span>Target Achievement: {todaysGoal?.target_percentage}%</span>
          </div>
        </div>
        
        {(todaysGoal?.status === 'pending' || todaysGoal?.status === 'reviewed') && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {todaysGoal?.status === 'reviewed' && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
          <h4 className="text-sm font-medium text-orange-900 mb-2 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Mentor Feedback - Revision Needed</span>
          </h4>
          <p className="text-orange-800">Your mentor has reviewed your goal and is requesting changes. Please edit and resubmit.</p>
        </div>
      )}
      
      {todaysGoal?.status === 'approved' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Goal Approved</span>
          </h4>
          <p className="text-green-800">Your mentor has approved your goal. You can now complete your reflection at the end of the day.</p>
        </div>
      )}
    </div>
  );

  // Render reflection section
  const renderReflectionSection = () => (
    <div className="mt-6">
      {!todaysReflection ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
          <MessageSquare className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Time to Reflect</h3>
          <p className="text-gray-600 mb-4">Your goal has been approved. Take a moment to reflect on your progress.</p>
          <DailyReflectionForm goal={todaysGoal!} studentId={userData?.id || ''} onSubmitSuccess={handleReflectionSubmit} />
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Reflection Completed</span>
          </h3>
          <p className="text-green-800 mb-2">{todaysReflection.reflection_answers.workedWell}</p>
          <div className="mt-4 text-sm text-green-700 font-medium">
            Achievement Level: {todaysReflection.achieved_percentage}%
          </div>
        </div>
      )}
    </div>
  );

  return (
    <React.Fragment>
      <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg relative">
        {isLoading && (
          <div className="absolute top-0 left-0 right-0">
            <div className="h-1 bg-primary-100 overflow-hidden rounded-t-lg">
              <div 
                className="h-1 bg-primary-500 transition-all duration-500 ease-in-out animate-progress"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Update Goal" : 'Set Learning Goal'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modify your learning objective for today' : 'Track and reflect on your daily progress'}
              </p>
            </div>
            {/* AI Feedback Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-2">
              {(!todaysGoal || isEditing) && (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 flex items-center gap-2"
                    onClick={async () => {
                      setShowFeedback(true);
                      setFeedbackLoading(true);
                      setFeedbackError('');
                      setFeedback('');
                      setFeedbackHtml('');
                      setGoalRating(null);
                      try {
                        if (!formData.goal_text) {
                          setFeedbackError('Please enter your goal first.');
                          setFeedbackLoading(false);
                          return;
                        }

                        // Build structured context from selected phase/topic using detailedTopics
                        const selectedTopic = topics.find(t => t.id === formData.topic_id);
                        const selectedPhase = phases.find(p => p.id === formData.phase_id);
                        let contextObj: any = { phase: selectedPhase?.name || 'General', topic: selectedTopic?.name || 'General' };
                        try {
                          if (selectedPhase && selectedTopic) {
                            const phaseName = selectedPhase.name;
                            const dt = (detailedTopics as any)[phaseName] as any[] | undefined;
                            const topicDetails = dt ? dt.find(x => x.name === selectedTopic.name) : undefined;
                            if (topicDetails) {
                              contextObj.description = topicDetails.description;
                              contextObj.keyTags = topicDetails.keyTags;
                              contextObj.deliverable = topicDetails.deliverable;
                            }
                          }
                        } catch (e) {
                          // ignore context building errors and send minimal context
                        }

                        const response = await getSmartFeedback({
                          goalText: formData.goal_text,
                          apiKey: userData?.gemini_api_key || '',
                          context: contextObj
                        });

                        const aiText = response.feedback || 'No feedback received.';
                        
                        // Parse and remove internal rating from feedback text
                        let displayText = aiText;
                        let extractedRating = null;
                        
                        // Try multiple patterns to extract rating
                        const patterns = [
                          /\*\*INTERNAL RATING:\s*\[(\d+)\]\*\*/i,
                          /INTERNAL RATING:\s*\[(\d+)\]/i,
                          /INTERNAL RATING:\s*(\d+)/i,
                          /\[(\d+)\]/i  // fallback for just numbers in brackets
                        ];
                        
                        for (const pattern of patterns) {
                          const match = aiText.match(pattern);
                          if (match) {
                            const rating = parseInt(match[1], 10);
                            if (rating >= 0 && rating <= 100) {
                              extractedRating = rating;
                              setGoalRating(rating);
                              break;
                            }
                          }
                        }
                        
                        // Remove all variations of internal rating text from display
                        if (extractedRating !== null) {
                          displayText = aiText
                            .replace(/\*\*INTERNAL RATING:\s*\[\d+\]\*\*/gi, '')
                            .replace(/INTERNAL RATING:\s*\[\d+\]/gi, '')
                            .replace(/INTERNAL RATING:\s*\d+/gi, '')
                            .replace(/^\s*\[\d+\]\s*$/gm, '') // remove lines that are just [number]
                            .trim();
                        }
                        
                        setFeedback(displayText);
                        const html = markdownToHtml(displayText);
                        setFeedbackHtml(html);

                        // Show notification if using fallback (no API key)
                        if (response.provider === 'fallback') {
                          setToastMessage('💡 Add your Gemini API key in profile settings for personalized AI feedback tailored to your curriculum!');
                          setShowToast(true);
                        }
                      } catch (err: any) {
                        setFeedbackError(err?.response?.data?.error || err.message || 'Failed to get feedback.');
                      } finally {
                        setFeedbackLoading(false);
                      }
                    }}
                    disabled={!formData.goal_text || feedbackLoading}
                    aria-label="Get SMART Feedback"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {feedbackLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Getting Feedback...</span>
                      </>
                    ) : (
                      <span>Get SMART Feedback</span>
                    )}
                  </button>
                </>
              )}
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
                <span>Curriculum loaded: {dataStatus.phasesCount} phases available</span>
              </div>
            </div>
          )}

          {/* Content based on state */}
          {(!todaysGoal || isEditing) ? (
            renderGoalForm()
          ) : (
            <>
              {renderGoalCard()}
              {todaysGoal.status === 'approved' && renderReflectionSection()}
            </>
          )}
        </div>
      </div>
    </div>

    {/* Slide-in drawer for AI-generated feedback (shown when feedback is requested) */}
    {showFeedback && (
      <>
        {/* Semi-transparent overlay for focus, but allows interaction */}
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 pointer-events-none"
          aria-hidden
        />

        {/* Drawer - slides in from right, positioned to not overlap input form */}
        <aside className={`fixed right-0 top-0 h-full bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out w-full sm:w-[400px] max-w-[90vw] pointer-events-auto ${
          showFeedback ? 'translate-x-0' : 'translate-x-full'
        }`} role="dialog" aria-modal="true">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <h3 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
              <span className="text-purple-600">💡</span>
              SMART Feedback
            </h3>
            <button
              onClick={() => setShowFeedback(false)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold transition-colors"
              aria-label="Close feedback panel"
            >
              ×
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
            <div className="mb-4 text-sm text-gray-700">
              <strong>SMART Hints</strong>
              <ul className="list-disc pl-5 mt-2 text-xs text-gray-600">
                <li><strong>S</strong>pecific: Is your goal clear and well-defined?</li>
                <li><strong>M</strong>easurable: Can you track progress or completion?</li>
                <li><strong>A</strong>chievable: Is it realistic given your resources?</li>
                <li><strong>R</strong>elevant: Does it align with your learning objectives?</li>
                <li><strong>T</strong>ime-bound: Is there a clear deadline or timeframe?</li>
              </ul>
            </div>

            {/* Goal Rating Progress Bar */}
            {goalRating !== null && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Goal Perfection Level</span>
                  <span className="text-sm font-bold text-purple-600">{goalRating}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${goalRating}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {goalRating >= 80 ? '🌟 Excellent goal!' : goalRating >= 60 ? '👍 Good foundation!' : '💡 Room for improvement'}
                </p>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-700 min-h-[200px]">
              {feedbackError && <div className="text-red-600 font-medium">{feedbackError}</div>}
              {!feedback && !feedbackError && feedbackLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Getting your personalized feedback...</p>
                </div>
              )}
              {feedbackHtml && (
                <div className="prose prose-sm text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: feedbackHtml }} />
              )}
              {!feedbackHtml && feedback && !feedbackError && (
                <div className="text-sm text-gray-800 italic">{feedback}</div>
              )}
            </div>
          </div>
        </aside>
      </>
    )}

    {/* Persistent feedback tab on left side */}
    {feedback && !showFeedback && (
      <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-30">
        <button
          onClick={() => setShowFeedback(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-4 rounded-r-lg shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 group"
          title="View SMART Feedback"
        >
          <div className="flex flex-col items-center gap-0">
            <span className="text-xs font-medium whitespace-nowrap">SMART</span>
            <span className="text-xs font-medium whitespace-nowrap">Feedback</span>
          </div>
          <div className="w-2 h-2 bg-white rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    )}

    <Toast message={toastMessage} visible={showToast} onClose={() => setShowToast(false)} />
    </React.Fragment>
  );
};

export default GoalSetting;