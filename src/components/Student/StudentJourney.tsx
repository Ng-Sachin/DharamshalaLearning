import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService, COLLECTIONS } from '../../services/firestore';
import { PhaseService, TopicService, PhaseTimelineService, GoalService } from '../../services/dataServices';
import { Phase, Topic, User } from '../../types';
import { UserSelector } from '../Common/UserSelector';
import { CampusFilter } from '../Common/CampusFilter';
import type { Campus } from '../Common/CampusFilter';
import { TrendingUp, BookOpen, Target, Award } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HouseStatsService, HouseAverageData } from '../../services/houseStatsService';

interface TopicProgress {
  topic: Topic;
  completed: boolean;
  completionDate?: Date;
  phaseName: string;
}

interface PhaseProgress {
  phase: Phase;
  topics: TopicProgress[];
  completedTopics: number;
  totalTopics: number;
  progressPercentage: number;
  expectedDays: number | null;
  earliestGoalDate?: Date; // Date when student first created a goal for this phase
}

interface PhaseDurationData {
  phaseName: string;
  daysSpent: number;
  status: 'completed' | 'current' | 'not_started';
  color: string;
  phaseLabel: string; // For display as "Phase 1", "Phase 2", etc.
}

interface CombinedChartData {
  phaseLabel: string;
  yourDays: number;
  cumulativeDays: number;
  houseAverage: number;
}

const calculatePhaseDurations = (phaseProgress: PhaseProgress[], campusJoiningDate?: Date): PhaseDurationData[] => {
  const today = new Date();
  const durations: PhaseDurationData[] = [];

  // Filter out "Self Learning Space" and sort by phase order
  const filteredPhases = phaseProgress
    .filter(phaseData => phaseData.phase.name !== 'Self Learning Space')
    .sort((a, b) => a.phase.order - b.phase.order);

  filteredPhases.forEach((phaseData, index) => {
  let startDate: Date;
  let endDate: Date;
  let status: 'completed' | 'current' | 'not_started';

    // Use the earliest goal creation date for this phase, fallback to campus joining date for Phase 1
    if (phaseData.earliestGoalDate) {
      startDate = phaseData.earliestGoalDate;
    } else if (index === 0) {
      startDate = campusJoiningDate || today;
    } else {
      // For subsequent phases without goals, use the completion date of the previous phase
      const prevPhase = filteredPhases[index - 1];
      const prevPhaseLastCompletion = prevPhase.topics
        .filter(t => t.completed && t.completionDate)
        .sort((a, b) => (b.completionDate?.getTime() || 0) - (a.completionDate?.getTime() || 0))[0];

      startDate = prevPhaseLastCompletion?.completionDate || campusJoiningDate || today;
    }

    // Determine end date and status
    if (phaseData.progressPercentage === 100) {
      // Phase is completed - find the last topic completion date
      const lastCompletion = phaseData.topics
        .filter(t => t.completed && t.completionDate)
        .sort((a, b) => (b.completionDate?.getTime() || 0) - (a.completionDate?.getTime() || 0))[0];

      endDate = lastCompletion?.completionDate || today;
      status = 'completed';
    } else if (phaseData.completedTopics > 0) {
  // Phase is current (in progress)
  endDate = today;
      status = 'current';
    } else {
      // Phase not started yet
      endDate = startDate;
      status = 'not_started';
    }

    // Calculate days spent
    const daysSpent = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Determine color based on status
    const color = status === 'completed' ? '#10B981' :
                  status === 'current' ? '#3B82F6' :
                  '#E5E7EB';

    durations.push({
      phaseName: phaseData.phase.name,
      daysSpent,
      status,
      color,
      phaseLabel: `Phase ${phaseData.phase.order}`
    });
  });

  return durations;
};

// OLD EXPENSIVE FUNCTION - REPLACED BY HouseStatsService
// This function has been moved to HouseStatsService.calculateAndCacheHouseAverages()
// and should only be triggered by admins manually via the refresh button
/*
const calculateHouseAverages = async (house: string, allPhases: Phase[]): Promise<HouseAverageData[]> => {
  ... expensive calculation moved to service ...
};
*/

const combineChartData = (studentData: PhaseDurationData[], houseData: HouseAverageData[]): CombinedChartData[] => {
  const combined: CombinedChartData[] = [];

  // Create a map of house data for easy lookup
  const houseDataMap = new Map(houseData.map(item => [item.phaseLabel, item.averageDays]));

  // Calculate cumulative days
  let cumulativeDays = 0;

  // Use student data as the base and add house averages + cumulative
  studentData.forEach(studentItem => {
    cumulativeDays += studentItem.daysSpent;
    const houseAverage = houseDataMap.get(studentItem.phaseLabel) || 0;
    combined.push({
      phaseLabel: studentItem.phaseLabel,
      yourDays: studentItem.daysSpent,
      cumulativeDays: cumulativeDays,
      houseAverage: houseAverage
    });
  });

  return combined;
};

const StudentJourney: React.FC = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress[]>([]);
  const [error, setError] = useState('');
  const [allPhases, setAllPhases] = useState<Phase[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<Campus>('All');
  const [combinedChartData, setCombinedChartData] = useState<CombinedChartData[]>([]);

    // Auto-set campus for academic associates (they can only view their own campus)
    useEffect(() => {
      if (userData?.role === 'academic_associate' && userData?.campus) {
        setSelectedCampus(userData.campus as Campus);
      }
    }, [userData?.role, userData?.campus]);

  const handleCampusSelect = (campus: Campus) => {
      // Academic associates cannot change campus - locked to their own
      if (userData?.role === 'academic_associate') return;
    setSelectedCampus(campus);
    setSelectedUserId('');
    setSelectedUserData(null);
  };

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    if (userId) {
      try {
        const users = await FirestoreService.getWhere<User>(COLLECTIONS.USERS, 'id', '==', userId);
        const user = users[0];
        setSelectedUserData(user);
      } catch (error) {
        console.error('Error fetching selected user:', error);
      }
    } else {
      setSelectedUserData(null);
    }
  };

  const loadJourneyData = useCallback(async () => {
    if (!userData?.id) return;

    try {
      setLoading(true);
      console.log('Starting journey data load...');
      
      // Determine which user's data to load
      const targetUserId = selectedUserId || userData.id;
      console.log('Loading data for user:', targetUserId);
      setLoadingStage('Gathering your learning journey data...');
      console.log('Starting to load real journey data...');

      // Load foundation data (phases and topics structure) from database
      setLoadingStage('Loading curriculum structure...');
      console.log('Loading phases and topics from database...');
      
      const [phases, allTopics] = await Promise.all([
        PhaseService.getAllPhases(),
        TopicService.getAll(COLLECTIONS.TOPICS)
      ]);
      
      console.log('Loaded phases from database:', phases.length);
      console.log('Loaded topics from database:', allTopics.length);
      
      // Group topics by phase_id for easier access
      const topicsByPhase = new Map<string, Topic[]>();
      allTopics.forEach((topic: any) => {
        if (!topicsByPhase.has(topic.phase_id)) {
          topicsByPhase.set(topic.phase_id, []);
        }
        topicsByPhase.get(topic.phase_id)!.push(topic);
      });
      
      setAllPhases(phases);

      // Load real user data from Firestore
      setLoadingStage('Looking up your goals and reflections...');
      console.log('Loading real goals and reflections...');
      console.log('Query parameters:', {
        collection: COLLECTIONS.DAILY_GOALS,
        field: 'student_id',
        value: targetUserId
      });
      
      // Use cached GoalService (avoids duplicate Firestore queries & supports coalescing)
      const userGoals = await GoalService.getGoalsByStudent(targetUserId);
      console.log('Loaded user goals:', userGoals);

      // Get phase timeline data for expected days
      const phaseTimelines = await PhaseTimelineService.getAllPhaseTimelines();
      const timelineMap = new Map(phaseTimelines.map(t => [t.phaseId, t]));

      // Process phase progress using real data
      setLoadingStage('Analyzing your learning progress...');
      console.log('Processing phase progress with real data...');
      const phaseProgressPromises = phases.map(async (phase) => {
        const topics = topicsByPhase.get(phase.id) || [];
        console.log(`Phase ${phase.name} has ${topics.length} topics`);

        // Calculate real topic completion based on goals and reflections
        const topicProgressPromises = topics.map(async (topic) => {
          // Find goals for this topic
          const topicGoals = userGoals.filter(goal => goal.topic_id === topic.id);
          console.log(`Goals for topic ${topic.name}:`, topicGoals);

          let completed = false;
          let completionDate: Date | undefined;

          // A topic is marked complete if:
          // 1. Student has goals for this topic AND
          // 2. Student has moved to a later phase (has goals in phases with higher order)
          try {
            if (topicGoals.length > 0) {
              // Check if student has started any later phases
              const currentPhaseOrder = phase.order;
              const hasLaterPhaseGoals = userGoals.some(g => {
                // Find the phase for this goal
                const goalPhase = phases.find(p => p.id === g.phase_id);
                return goalPhase && goalPhase.order > currentPhaseOrder;
              });

              // Mark complete if student has moved beyond this phase
              if (hasLaterPhaseGoals) {
                completed = true;
                // Use the last goal date as completion date
                const sortedGoals = topicGoals.sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                completionDate = new Date(sortedGoals[0].created_at);
              } else {
                // Student is still on this phase - mark as in progress (not complete)
                completed = false;
              }
            }
          } catch (error) {
            console.error('Error checking phase completion:', error);
          }

          return {
            topic,
            completed,
            completionDate,
            phaseName: phase.name
          };
        });

        const topicProgress = await Promise.all(topicProgressPromises);

        // Find earliest goal creation date for this phase
        // Try phase_id matching first, fallback to topic-based matching
        let phaseGoals = userGoals.filter(goal => goal.phase_id === phase.id);

        // If no goals found by phase_id, try topic-based matching as fallback
        if (phaseGoals.length === 0) {
          const phaseTopicIds = topics.map(t => t.id);
          phaseGoals = userGoals.filter(goal => phaseTopicIds.includes(goal.topic_id));
          console.log(`Phase ${phase.name}: found ${phaseGoals.length} goals via topic fallback`);
        } else {
          console.log(`Phase ${phase.name}: found ${phaseGoals.length} goals via phase_id`);
        }

        const earliestGoalDate = phaseGoals.length > 0
          ? new Date(Math.min(...phaseGoals.map(g => new Date(g.created_at).getTime())))
          : undefined;        const completedTopics = topicProgress.filter(tp => tp.completed).length;
        const totalTopics = topicProgress.length;
        const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
        const expectedDays = timelineMap.get(phase.id)?.expectedDays || null;

        return {
          phase,
          topics: topicProgress,
          completedTopics,
          totalTopics,
          progressPercentage,
          expectedDays,
          earliestGoalDate
        };
      });

      const phaseProgressData = await Promise.all(phaseProgressPromises);

      console.log('Detailed phase progress:', JSON.stringify(phaseProgressData, null, 2));
      console.log('Summary phase progress:', phaseProgressData.map(p => ({
        phase: p.phase.name,
        completed: p.completedTopics,
        total: p.totalTopics,
        percentage: Math.round(p.progressPercentage),
        topics: p.topics.map(t => ({
          name: t.topic.name,
          completed: t.completed,
          completionDate: t.completionDate
        }))
      })));

      setPhaseProgress(phaseProgressData);

      // Calculate phase duration data for the chart
      const durationData: PhaseDurationData[] = calculatePhaseDurations(phaseProgressData, (selectedUserData || userData)?.campus_joining_date);
      console.log('Duration data:', durationData);

      // Load cached house averages (fast - only 3-5 Firestore reads)
      let houseData: HouseAverageData[] = [];
      const targetUser = selectedUserData || userData;
      if (targetUser?.house) {
        try {
          setLoadingStage('Loading house comparison data...');
          console.log('Loading cached house average data...');
          houseData = await HouseStatsService.getHouseAverages(targetUser.house);
          console.log('Loaded house averages from cache:', houseData);
          
          if (houseData.length === 0) {
            console.warn('No cached house stats found. Admin should refresh house statistics.');
          }
        } catch (error) {
          console.warn('Failed to load house averages:', error);
        }
      }

      // Combine student data with house averages
      const combinedData = combineChartData(durationData, houseData);
      console.log('Combined chart data:', combinedData);
      setCombinedChartData(combinedData);

      console.log('Real journey data loaded successfully');

    } catch (error) {
      console.error('Error loading real journey data:', error);
      setError('Failed to load journey data');
    } finally {
      setLoading(false);
    }
  }, [userData, selectedUserId, selectedUserData]);

  const lastLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${selectedUserId || userData?.id}`;
    if (lastLoadedRef.current === key) return; // prevent StrictMode double invoke
    lastLoadedRef.current = key;
    loadJourneyData();
  }, [loadJourneyData, selectedUserId, userData?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-800">{loadingStage || 'Preparing your journey data...'}</p>
          <p className="text-sm text-gray-500">This might take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const totalCompletedTopics = phaseProgress.reduce((sum, phase) => sum + phase.completedTopics, 0);
  const totalTopics = phaseProgress.reduce((sum, phase) => sum + phase.totalTopics, 0);
  const overallProgress = totalTopics > 0 ? (totalCompletedTopics / totalTopics) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Journey</h1>
        <p className="text-gray-600">Track your progress through the curriculum phases and topics</p>
      </div>

        {/* Show filters for admins and academic associates */}
        {(userData?.isAdmin || userData?.role === 'academic_associate') && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Filter Students</h3>
          <div className="flex flex-col md:flex-row gap-4">
              {userData?.isAdmin ? (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <CampusFilter
                    selectedCampus={selectedCampus}
                    onCampusSelect={handleCampusSelect}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <div className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
                    {userData?.campus || 'Not Set'}
                  </div>
                </div>
              )}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <UserSelector 
                onUserSelect={handleUserSelect}
                currentUserId={selectedUserId || userData?.id}
                campusFilter={selectedCampus}
              />
            </div>
          </div>
          {selectedUserData && (
            <p className="text-sm text-gray-600 mt-4">
              Viewing journey for: {selectedUserData.display_name || selectedUserData.name || selectedUserData.email}
            </p>
          )}
        </div>
      )}

      {/* Main Journey Card */}
      <div className="bg-white rounded-xl shadow-xl p-4 mb-8">
        {/* Student Info Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{selectedUserData?.name || userData?.name}</h2>
              <p className="text-gray-600 text-sm truncate">Student ID: <span className="font-mono break-words flex flex-wrap">{selectedUserData?.id || userData?.id}</span></p>
            </div>
            <div className="text-right mt-4 sm:mt-0 flex-shrink-0">
              <div className="text-sm text-gray-500">Current Phase</div>
              <div className="text-lg font-semibold text-blue-600">
                {selectedUserData?.current_phase_name || userData?.current_phase_name || 'Not Set'}
              </div>
            </div>
          </div>

          {/* Curriculum Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-900">Total Phases</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{allPhases.length}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-semibold text-green-900">Total Topics</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{totalTopics}</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Award className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-semibold text-yellow-900">Completed</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{totalCompletedTopics}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-semibold text-purple-900">Progress</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{Math.round(overallProgress)}%</p>
            </div>
          </div>
        </div>

        {/* Phase Duration Chart - Moved up after stats */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Phase Duration Analysis</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Your Progress vs {(selectedUserData || userData)?.house} House Average
            </h4>
            <div className="h-64 sm:h-80">
              {combinedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="phaseLabel"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'yourDays') return [`${value} days`, 'Phase Days'];
                        if (name === 'cumulativeDays') return [`${value} days`, 'Cumulative Total'];
                        if (name === 'houseAverage') return [`${value} days`, 'House Average'];
                        return [`${value} days`, name];
                      }}
                      labelFormatter={(label: string) => `${label}`}
                    />
                    <Legend />
                    
                    {/* Bar chart for individual phase days */}
                    <Bar
                      yAxisId="left"
                      dataKey="yourDays"
                      fill="#3B82F6"
                      name="Phase Days"
                      radius={[8, 8, 0, 0]}
                    />
                    
                    {/* Line chart for cumulative days */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="cumulativeDays"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2 }}
                      name="Cumulative Total"
                    />
                    
                    {/* Line chart for house average */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="houseAverage"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                      name="House Average"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading chart data...
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center mt-6 gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-6 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Phase Days (Bar)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-1 bg-amber-500 rounded mr-2"></div>
                <span>Cumulative Total (Line)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-1 bg-green-500 rounded mr-2" style={{ borderTop: '2px dashed #10B981' }}></div>
                <span>House Average (Dashed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase-wise Progress - Moved down after chart */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Phase Progress</h3>
          <div className="space-y-4">
            {phaseProgress.map((phaseData) => (
              <div key={phaseData.phase.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                  <h4 className="text-lg font-medium text-gray-900">{phaseData.phase.name}</h4>
                  <div className="flex items-center space-x-4 mt-3 sm:mt-0">
                    {phaseData.expectedDays && (
                      <span className="text-sm text-blue-600 font-medium">
                        Expected: {phaseData.expectedDays} days
                      </span>
                    )}
                    <span className="text-sm text-gray-600">
                      {phaseData.completedTopics}/{phaseData.totalTopics} topics completed
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${phaseData.progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {Math.round(phaseData.progressPercentage)}% complete
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Details section removed as per request */}
      </div>
    </div>
  );
};
export default StudentJourney;