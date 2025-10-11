import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
// import { GoalService, ReflectionService, PhaseService, TopicService } from '../../services/dataServices';
import { Phase, Topic } from '../../types';
import { TrendingUp, BookOpen, Target, Award, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Utility for today
const today = new Date();

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
}

interface PhaseDurationData {
  phaseName: string;
  daysSpent: number;
  status: 'completed' | 'current' | 'not_started';
  color: string;
  phaseLabel: string; // For display as "Phase 1", "Phase 2", etc.
}

interface HouseAverageData {
  phaseLabel: string;
  averageDays: number;
}

interface CombinedChartData {
  phaseLabel: string;
  yourDays: number;
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

    // For Phase 1, use campus joining date as start
    if (index === 0) {
  startDate = campusJoiningDate || today;
    } else {
      // For subsequent phases, use the completion date of the previous phase's last topic
      const prevPhase = filteredPhases[index - 1];
      const prevPhaseLastCompletion = prevPhase.topics
        .filter(t => t.completed && t.completionDate)
        .sort((a, b) => (b.completionDate?.getTime() || 0) - (a.completionDate?.getTime() || 0))[0];

      startDate = prevPhaseLastCompletion?.completionDate || today;
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
      phaseLabel: `Phase ${index + 1}`
    });
  });

  return durations;
};

const calculateHouseAverages = async (house: string, allPhases: Phase[]): Promise<HouseAverageData[]> => {
  try {
    const { UserService } = await import('../../services/firestore');
    const GoalService = (await import('../../services/dataServices')).GoalService;
    const ReflectionService = (await import('../../services/dataServices')).ReflectionService;

    // Get all students in the house
    const houseStudents = await UserService.getUsersByHouse(house);

    // Filter out "Self Learning Space" and sort by phase order
    const filteredPhases = allPhases
      .filter(phase => phase.name !== 'Self Learning Space')
      .sort((a, b) => a.order - b.order);

    const averages: HouseAverageData[] = [];

    for (let i = 0; i < filteredPhases.length; i++) {
      const phase = filteredPhases[i];
      const phaseDurations: number[] = [];

      for (const student of houseStudents) {
        if (!student.campus_joining_date) continue;

        // Get student's goals for this phase
        const studentGoals = await GoalService.getGoalsByStudent(student.id);
        const phaseGoals = studentGoals.filter(goal => goal.phase_id === phase.id);

        if (phaseGoals.length === 0) continue;

        // Calculate start date for this student in this phase
        let startDate: Date;
        if (i === 0) {
          startDate = student.campus_joining_date;
        } else {
          // Find completion date of previous phase
          const prevPhase = filteredPhases[i - 1];
          const prevPhaseGoals = studentGoals.filter(goal => goal.phase_id === prevPhase.id);

          let prevPhaseEndDate: Date | null = null;
          for (const goal of prevPhaseGoals) {
            try {
              const reflection = await ReflectionService.getReflectionByGoal(goal.id);
              if (reflection && reflection.achieved_percentage === 100) {
                const completionDate = new Date(reflection.created_at);
                if (!prevPhaseEndDate || completionDate > prevPhaseEndDate) {
                  prevPhaseEndDate = completionDate;
                }
              }
            } catch (error) {
              // Continue checking other goals
            }
          }

          startDate = prevPhaseEndDate || today;
        }

        // Calculate end date (last completion in this phase or current date)
        let endDate: Date = new Date();
        let hasCompletedTopics = false;

        for (const goal of phaseGoals) {
          try {
            const reflection = await ReflectionService.getReflectionByGoal(goal.id);
            if (reflection && reflection.achieved_percentage === 100) {
              const completionDate = new Date(reflection.created_at);
              if (completionDate > endDate || !hasCompletedTopics) {
                endDate = completionDate;
                hasCompletedTopics = true;
              }
            }
          } catch (error) {
            // Continue checking other goals
          }
        }

        if (hasCompletedTopics) {
          const daysSpent = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
          phaseDurations.push(daysSpent);
        }
      }

      // Calculate average for this phase
      const averageDays = phaseDurations.length > 0
        ? Math.round(phaseDurations.reduce((sum, days) => sum + days, 0) / phaseDurations.length)
        : 0;

      averages.push({
        phaseLabel: `Phase ${i + 1}`,
        averageDays
      });
    }

    return averages;
  } catch (error) {
    console.error('Error calculating house averages:', error);
    return [];
  }
};

const combineChartData = (studentData: PhaseDurationData[], houseData: HouseAverageData[]): CombinedChartData[] => {
  const combined: CombinedChartData[] = [];

  // Create a map of house data for easy lookup
  const houseDataMap = new Map(houseData.map(item => [item.phaseLabel, item.averageDays]));

  // Use student data as the base and add house averages
  studentData.forEach(studentItem => {
    const houseAverage = houseDataMap.get(studentItem.phaseLabel) || 0;
    combined.push({
      phaseLabel: studentItem.phaseLabel,
      yourDays: studentItem.daysSpent,
      houseAverage: houseAverage
    });
  });

  return combined;
};

const StudentJourney: React.FC = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress[]>([]);
  const [error, setError] = useState('');
  const [allPhases, setAllPhases] = useState<Phase[]>([]);
  const [combinedChartData, setCombinedChartData] = useState<CombinedChartData[]>([]);

  const loadJourneyData = useCallback(async () => {
    if (!userData?.id) return;

    try {
      setLoading(true);
      console.log('Starting to load journey data...');

      // Skip Firestore entirely, use local data directly
      console.log('Using local curriculum data...');
      const { initialPhases, detailedTopics } = await import('../../data/initialData');
      const phases: Phase[] = initialPhases.map((phase, index) => ({
        id: `local-${index}`,
        name: phase.name,
        order: phase.order,
        isSenior: phase.isSenior,
        created_at: new Date()
      }));
      console.log('Loaded phases:', phases.length);

      setAllPhases(phases);

      // Skip goals entirely for now - use empty array
      console.log('Skipping goals, using empty array...');

      // Process phase progress using local data only
      console.log('Processing phase progress...');
      const phaseProgressData: PhaseProgress[] = phases.map((phase) => {
        const phaseTopics = detailedTopics[phase.name] || [];
        const topics: Topic[] = phaseTopics.map((topic, index) => ({
          id: `local-topic-${phase.id}-${index}`,
          name: topic.name,
          order: topic.order,
          deliverable: topic.deliverable,
          description: topic.description || '',
          phase_id: phase.id,
          created_at: new Date()
        }));

        // Create topic progress with all incomplete for now
        const topicProgress: TopicProgress[] = topics.map((topic) => ({
          topic,
          completed: false, // All topics marked as incomplete for now
          completionDate: undefined,
          phaseName: phase.name
        }));

        const completedTopics = 0; // No completed topics for now
        const totalTopics = topicProgress.length;
        const progressPercentage = 0; // 0% progress for now

        return {
          phase,
          topics: topicProgress,
          completedTopics,
          totalTopics,
          progressPercentage
        };
      });

      console.log('Processed phase progress:', phaseProgressData.length);
      setPhaseProgress(phaseProgressData);

      // Calculate phase duration data for the chart
      const durationData: PhaseDurationData[] = calculatePhaseDurations(phaseProgressData, userData?.campus_joining_date);

      // Set chart data without house averages
      const combinedData = combineChartData(durationData, []);
      setCombinedChartData(combinedData);

      console.log('Journey data loaded successfully');

    } catch (error) {
      console.error('Error loading journey data:', error);
      setError('Failed to load journey data');
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading journey data...</span>
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

      {/* Main Journey Card */}
      <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
        {/* Student Info Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{userData?.name}</h2>
              <p className="text-gray-600">Student ID: {userData?.id}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Phase</div>
              <div className="text-lg font-semibold text-blue-600">
                {userData?.current_phase_name || 'Not Set'}
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

        {/* Phase-wise Progress */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Phase Progress</h3>
          <div className="space-y-4">
            {phaseProgress.map((phaseData) => (
              <div key={phaseData.phase.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-medium text-gray-900">{phaseData.phase.name}</h4>
                  <span className="text-sm text-gray-600">
                    {phaseData.completedTopics}/{phaseData.totalTopics} topics completed
                  </span>
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

        {/* Phase Duration Chart */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Phase Duration Analysis</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Your Progress vs {userData?.house} House Average
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="phaseLabel"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Days Spent', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'yourDays') return [`${value} days`, 'Your Progress'];
                      if (name === 'houseAverage') return [`${value} days`, 'House Average'];
                      return [`${value} days`, name];
                    }}
                    labelFormatter={(label: string) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="yourDays"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                    name="Your Progress"
                  />
                  <Line
                    type="monotone"
                    dataKey="houseAverage"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                    name="House Average"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center mt-6 space-x-8 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-1 bg-blue-500 rounded mr-2"></div>
                <span>Your Progress</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-1 bg-green-500 rounded mr-2"></div>
                <span>House Average</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Topic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phaseProgress.flatMap(phaseData =>
              phaseData.topics.map((topicData) => (
                <div
                  key={topicData.topic.id}
                  className={`rounded-lg p-4 border-2 transition-all duration-200 ${
                    topicData.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {topicData.topic.name}
                      </h4>
                      <p className="text-xs text-gray-500">{topicData.phaseName}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      topicData.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>

                  {topicData.completed && topicData.completionDate && (
                    <div className="flex items-center text-xs text-green-600 mt-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      Completed {topicData.completionDate.toLocaleDateString()}
                    </div>
                  )}

                  {!topicData.completed && (
                    <div className="text-xs text-gray-400 mt-2">
                      Not completed yet
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};export default StudentJourney;