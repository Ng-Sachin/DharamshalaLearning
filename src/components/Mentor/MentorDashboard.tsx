import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/firestore';
import { GoalService, ReflectionService, PairProgrammingService, AdminService } from '../../services/dataServices';
import { User, MenteeOverview, DailyGoal, DailyReflection } from '../../types';
import {
  Users,
  Target,
  MessageSquare,
  Code,
  Bell,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import MentorCampusTab from '../Admin/MentorCampusTab';
import { SpinnerLoader } from '../Common/BoltLoaderComponent';

type ViewTypeValues = 'my-goals' | 'my-mentees' | 'my-mentor' | 'campus-overview';

const VIEW_TYPES = {
  MY_GOALS: 'my-goals' as ViewTypeValues,
  MY_MENTEES: 'my-mentees' as ViewTypeValues,
  MY_MENTOR: 'my-mentor' as ViewTypeValues,
  CAMPUS_OVERVIEW: 'campus-overview' as ViewTypeValues,
} as const;

const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [currentView, setCurrentView] = useState<ViewTypeValues>(VIEW_TYPES.MY_GOALS);
  const [menteeOverviews, setMenteeOverviews] = useState<MenteeOverview[]>([]);
  const [mentorData, setMentorData] = useState<User | null>(null);
  const [myGoals, setMyGoals] = useState<DailyGoal[]>([]);
  const [myReflections, setMyReflections] = useState<DailyReflection[]>([]);
  const [stats, setStats] = useState({
    myGoals: { total: 0, pending: 0 },
    myReflections: { total: 0, pending: 0 },
    menteesGoals: { total: 0, pending: 0 },
    menteesReflections: { total: 0, pending: 0 },
    mentorGoals: { total: 0, pending: 0 },
    mentorReflections: { total: 0, pending: 0 },
    campusGoals: { total: 0, pending: 0 },
    campusReflections: { total: 0, pending: 0 },
    totalMentees: 0,
    totalStudents: 0
  });
  const [totalPendingPairRequests, setTotalPendingPairRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      if (!userData?.id) {
        navigate('/dashboard');
        return;
      }

      // Load all data in parallel
      const [
        myGoals,
        myReflections,
        mentees,
        pairRequests,
        allUsers
      ] = await Promise.all([
        GoalService.getGoalsByStudent(userData.id),
        ReflectionService.getReflectionsByStudent(userData.id),
        UserService.getStudentsByMentor(userData.id),
        PairProgrammingService.getRequestsByMentor(userData.id),
        AdminService.getAllUsers()
      ]);

      // Store actual data
      setMyGoals(myGoals);
      setMyReflections(myReflections);
      const newStats = {
        myGoals: {
          total: myGoals.length,
          pending: myGoals.filter(g => g.status === 'pending').length
        },
        myReflections: {
          total: myReflections.length,
          pending: myReflections.filter(r => r.status === 'pending').length
        },
        menteesGoals: { total: 0, pending: 0 },
        menteesReflections: { total: 0, pending: 0 },
        mentorGoals: { total: 0, pending: 0 },
        mentorReflections: { total: 0, pending: 0 },
        campusGoals: { total: 0, pending: 0 },
        campusReflections: { total: 0, pending: 0 },
        totalMentees: mentees.length,
        totalStudents: allUsers.filter(u => u.campus === (userData?.campus || 'dharamshala') && !u.isAdmin).length
      };

      // Load mentees data
      if (mentees.length > 0) {
        const menteesIds = mentees.map(m => m.id);
        const [menteesGoalsData, menteesReflectionsData] = await Promise.all([
          Promise.all(menteesIds.map(id => GoalService.getGoalsByStudent(id))).then(results => results.flat()),
          Promise.all(menteesIds.map(id => ReflectionService.getReflectionsByStudent(id))).then(results => results.flat())
        ]);

        newStats.menteesGoals = {
          total: menteesGoalsData.length,
          pending: menteesGoalsData.filter(g => g.status === 'pending').length
        };
        newStats.menteesReflections = {
          total: menteesReflectionsData.length,
          pending: menteesReflectionsData.filter(r => r.status === 'pending').length
        };
      }

      // Load mentor data
      if (userData.mentor_id) {
        const mentor = allUsers.find(u => u.id === userData.mentor_id);
        setMentorData(mentor || null);

        if (mentor) {
          const [mentorGoalsData, mentorReflectionsData] = await Promise.all([
            GoalService.getGoalsByStudent(mentor.id),
            ReflectionService.getReflectionsByStudent(mentor.id)
          ]);

          newStats.mentorGoals = {
            total: mentorGoalsData.length,
            pending: mentorGoalsData.filter(g => g.status === 'pending').length
          };
          newStats.mentorReflections = {
            total: mentorReflectionsData.length,
            pending: mentorReflectionsData.filter(r => r.status === 'pending').length
          };
        }
      }

      // Load campus data (goals and reflections for user's campus)
      const campusStudents = allUsers.filter(u => u.campus === (userData?.campus || 'dharamshala') && !u.isAdmin);
      const campusStudentIds = campusStudents.map(s => s.id);

      const [campusGoalsData, campusReflectionsData] = await Promise.all([
        Promise.all(campusStudentIds.map(id => GoalService.getGoalsByStudent(id))).then(results => results.flat()),
        Promise.all(campusStudentIds.map(id => ReflectionService.getReflectionsByStudent(id))).then(results => results.flat())
      ]);

      newStats.campusGoals = {
        total: campusGoalsData.length,
        pending: campusGoalsData.filter(g => g.status === 'pending').length
      };
      newStats.campusReflections = {
        total: campusReflectionsData.length,
        pending: campusReflectionsData.filter(r => r.status === 'pending').length
      };

      setStats(newStats);
      setTotalPendingPairRequests(pairRequests.filter(r => r.status === 'pending').length);

      // Build mentee overviews for detailed view
      const overviews = await Promise.all(
        mentees.map(async (student: User): Promise<MenteeOverview> => {
          const [goals, reflections] = await Promise.all([
            GoalService.getGoalsByStudent(student.id, 30),
            ReflectionService.getReflectionsByStudent(student.id)
          ]);

          const latestGoal = goals.length > 0 ? goals[0] : undefined;
          const latestReflection = reflections.length > 0 ? reflections[0] : undefined;

          const reflectionsWithAchievement = reflections.filter(
            r => r.achieved_percentage !== undefined && r.achieved_percentage !== null
          );
          const avgAchievement = reflectionsWithAchievement.length > 0
            ? Math.round(
                reflectionsWithAchievement.reduce((sum, r) => sum + (r.achieved_percentage || 0), 0) /
                reflectionsWithAchievement.length
              )
            : 0;

          return {
            student,
            pending_goals: goals.filter(g => g.status === 'pending').length,
            pending_reflections: reflections.filter(r => r.status === 'pending').length,
            latest_goal: latestGoal,
            latest_reflection: latestReflection,
            average_achievement: avgAchievement,
            current_phase: latestGoal?.phase_id,
            current_topic: latestGoal?.topic_id
          };
        })
      );

      setMenteeOverviews(overviews);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userData, navigate]);

  useEffect(() => {
    if (userData?.id) {
      loadDashboardData();
    }
  }, [userData, loadDashboardData]);

  const getTotalPendingReviews = () => {
    return stats.myGoals.pending + stats.myReflections.pending +
           (userData?.isAdmin ? stats.campusGoals.pending + stats.campusReflections.pending :
            stats.menteesGoals.pending + stats.menteesReflections.pending);
  };

  const getAchievementColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const canApprove = (studentId: string) => {
    if (userData?.isAdmin) return true;
    return menteeOverviews.some(mentee => mentee.student.id === studentId);
  };

  if (loading) {
    return <SpinnerLoader />;
  }

  // Show campus overview when selected
  // if (currentView === 'campus-overview') {
  //   return <MentorCampusTab campusId={userData?.campus || 'dharamshala'} />;
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">Welcome back, {userData?.name}</p>
            </div>
            {getTotalPendingReviews() > 0 && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600 animate-pulse" />
                <span className="text-sm font-semibold text-yellow-800">
                  {getTotalPendingReviews()} Pending Review{getTotalPendingReviews() !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Cards - Always Visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* My Goals Card */}
        <button
          onClick={() => setCurrentView(VIEW_TYPES.MY_GOALS)}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            currentView === VIEW_TYPES.MY_GOALS
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <Target className="h-8 w-8 text-blue-600" />
            {stats.myGoals.pending > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.myGoals.pending}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">My Goals</h3>
          <p className="text-sm text-gray-600">
            {stats.myGoals.total} total • {stats.myGoals.pending} pending
          </p>
        </button>

        {/* My Mentees Card */}
        <button
          onClick={() => setCurrentView(VIEW_TYPES.MY_MENTEES)}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            currentView === VIEW_TYPES.MY_MENTEES
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-green-300 hover:shadow-sm bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <UserCheck className="h-8 w-8 text-green-600" />
            {(stats.menteesGoals.pending + stats.menteesReflections.pending) > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.menteesGoals.pending + stats.menteesReflections.pending}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">My Mentees</h3>
          <p className="text-sm text-gray-600">
            {stats.totalMentees} students • {stats.menteesGoals.pending + stats.menteesReflections.pending} pending
          </p>
        </button>

        {/* My Mentor Card */}
        <button
          onClick={() => setCurrentView(VIEW_TYPES.MY_MENTOR)}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            currentView === VIEW_TYPES.MY_MENTOR
              ? 'border-purple-500 bg-purple-50 shadow-md'
              : 'border-gray-200 hover:border-purple-300 hover:shadow-sm bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <GraduationCap className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">My Mentor</h3>
          <p className="text-sm text-gray-600">
            {mentorData?.name || 'Not assigned'} • {stats.mentorGoals.total + stats.mentorReflections.total} items
          </p>
        </button>

        {/* Campus Overview Card */}
        <button
          onClick={() => setCurrentView(VIEW_TYPES.CAMPUS_OVERVIEW)}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            currentView === VIEW_TYPES.CAMPUS_OVERVIEW
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 hover:border-orange-300 hover:shadow-sm bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="h-8 w-8 text-orange-600" />
            {(stats.campusGoals.pending + stats.campusReflections.pending) > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.campusGoals.pending + stats.campusReflections.pending}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Campus Overview</h3>
          <p className="text-sm text-gray-600">
            {stats.totalStudents} students • {stats.campusGoals.pending + stats.campusReflections.pending} pending
          </p>
        </button>
      </div>

      {/* Content Area */}
      {currentView === VIEW_TYPES.MY_GOALS && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">My Goals & Reflections</h2>

          <div className="space-y-6">
            {/* Group goals and reflections by date */}
            {(() => {
              // Combine and sort goals and reflections by date (pending first, then by date)
              const allItems = [
                ...myGoals.map(goal => ({
                  type: 'goal' as const,
                  date: goal.created_at,
                  data: goal,
                  status: goal.status,
                  id: goal.id
                })),
                ...myReflections.map(reflection => ({
                  type: 'reflection' as const,
                  date: reflection.created_at,
                  data: reflection,
                  status: reflection.status,
                  id: reflection.id
                }))
              ].sort((a, b) => {
                // Sort by status first (pending first), then by date (newest first)
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              });

              // Group by date
              const groupedByDate = allItems.reduce((groups, item) => {
                const dateKey = new Date(item.date).toDateString();
                if (!groups[dateKey]) {
                  groups[dateKey] = [];
                }
                groups[dateKey].push(item);
                return groups;
              }, {} as Record<string, typeof allItems>);

              return Object.entries(groupedByDate).map(([dateStr, items]) => (
                <div key={dateStr} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {new Date(dateStr).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={`${item.type}-${item.id}`} className={`border-l-4 rounded-r-lg p-3 ${
                        item.status === 'pending'
                          ? 'border-l-yellow-400 bg-yellow-50'
                          : item.status === 'approved'
                          ? 'border-l-green-400 bg-green-50'
                          : 'border-l-gray-400 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              {item.type === 'goal' ? (
                                <Target className="h-4 w-4 mr-2 text-blue-600" />
                              ) : (
                                <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                              )}
                              <span className="font-medium text-sm capitalize">{item.type}</span>
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                item.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : item.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status}
                              </span>
                            </div>

                            {item.type === 'goal' ? (
                              <p className="text-sm text-gray-700 mb-1">
                                {item.data.goal_text}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-700 mb-1">
                                <strong>What worked well:</strong> {item.data.reflection_answers?.workedWell}
                              </p>
                            )}

                            <div className="flex items-center text-xs text-gray-500">
                              {item.type === 'goal' && item.data.target_percentage && (
                                <span className="mr-3">Target: {item.data.target_percentage}%</span>
                              )}
                              {item.type === 'reflection' && item.data.achieved_percentage && (
                                <span>Achieved: {item.data.achieved_percentage}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}

            {myGoals.length === 0 && myReflections.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Goals or Reflections Yet</h3>
                <p className="mb-4">Start your learning journey by setting your first goal and writing reflections.</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => navigate('/goals')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Set Your First Goal
                  </button>
                  <button
                    onClick={() => navigate('/reflection')}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Write First Reflection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === VIEW_TYPES.MY_MENTEES && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Mentees Overview</h2>
          {menteeOverviews.length === 0 ? (
            <p className="text-gray-500">No mentees assigned yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menteeOverviews.map((overview) => (
                <div key={overview.student.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{overview.student.name}</h3>
                    {(overview.pending_goals + overview.pending_reflections) > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {overview.pending_goals + overview.pending_reflections}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goals:</span>
                      <span>{overview.pending_goals} pending</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reflections:</span>
                      <span>{overview.pending_reflections} pending</span>
                    </div>
                    {overview.average_achievement > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Achievement:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAchievementColor(overview.average_achievement)}`}>
                          {overview.average_achievement}%
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/mentor/mentee/${overview.student.id}`)}
                    className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentView === VIEW_TYPES.MY_MENTOR && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Mentor</h2>
          {mentorData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">{mentorData.name}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Goals:</span>
                    <span>{stats.mentorGoals.total} total</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reflections:</span>
                    <span>{stats.mentorReflections.total} total</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Reviews:</span>
                    <span>{stats.mentorGoals.pending + stats.mentorReflections.pending}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => navigate(`/mentor/mentee/${mentorData.id}`)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Mentor Details
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No mentor assigned yet</p>
          )}
        </div>
      )}

      {currentView === VIEW_TYPES.CAMPUS_OVERVIEW && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Campus Overview</h2>
          <MentorCampusTab campusId={userData?.campus || 'dharamshala'} />
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
