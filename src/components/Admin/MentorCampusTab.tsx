import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminService, GoalService, ReflectionService } from '../../services/dataServices';
import { User, DailyGoal, DailyReflection } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Users, Target, MessageSquare, RefreshCw, ChevronDown, CheckCircle, Eye, ArrowLeft } from 'lucide-react';

interface CampusData {
  students: User[];
  goals: DailyGoal[];
  reflections: DailyReflection[];
}

const PAGE_SIZE = 25;

// Custom hook for debouncing
const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Loading skeleton component
const StudentCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse">
    <div className="h-5 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
    <div className="flex space-x-4 mb-2">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

const MentorCampusTab: React.FC<{ campusId: string }> = ({ campusId }) => {
  const { userData } = useAuth();

  // Ensure hooks are always called
  const [campusData, setCampusData] = useState<CampusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'goals' | 'reflections'>('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userGoals, setUserGoals] = useState<DailyGoal[]>([]);
  const [userReflections, setUserReflections] = useState<DailyReflection[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchCampusData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const data = await AdminService.getCampusData(campusId, forceRefresh);
    setCampusData(data);
    setLoading(false);
  }, [campusId]);

  useEffect(() => {
    console.log('MentorCampusTab: Fetching data for campus:', campusId);
    fetchCampusData();
  }, [campusId, fetchCampusData]);

  const handleRefresh = () => {
    fetchCampusData(true);
  };

  const selectUser = async (user: User) => {
    setSelectedUser(user);
    setUserLoading(true);

    try {
      const [goals, reflections] = await Promise.all([
        GoalService.getGoalsByStudent(user.id, 50),
        ReflectionService.getReflectionsByStudent(user.id)
      ]);

      setUserGoals(goals);
      setUserReflections(reflections);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const goBackToList = () => {
    setSelectedUser(null);
    setUserGoals([]);
    setUserReflections([]);
  };

  const canApprove = (studentId: string) => {
    if (!userData) return false;

    // Admin can approve everyone
    if (userData.isAdmin || userData.role === 'admin') return true;

    // Assigned mentor can approve their mentees
    if (userData.isMentor || userData.role === 'mentor' || userData.role === 'super_mentor') {
      // For now, allow mentors to approve (we can refine this later with proper mentor-student assignment)
      return true;
    }

    return false;
  };

  const handleGoalApproval = async (goalId: string, status: 'approved' | 'reviewed') => {
    try {
      await GoalService.reviewGoal(goalId, userData?.id || 'admin', status);
      // Refresh user data
      if (selectedUser) {
        await selectUser(selectedUser);
      }
      // Also refresh campus overview
      fetchCampusData(true);
    } catch (error) {
      console.error('Error approving goal:', error);
    }
  };

  const handleReflectionApproval = async (reflectionId: string, status: 'approved' | 'reviewed') => {
    try {
      await ReflectionService.reviewReflection(reflectionId, userData?.id || 'admin', status);
      // Refresh user data
      if (selectedUser) {
        await selectUser(selectedUser);
      }
      // Also refresh campus overview
      fetchCampusData(true);
    } catch (error) {
      console.error('Error approving reflection:', error);
    }
  };

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    if (!campusData) return [];
    let students = campusData.students;
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      students = students.filter(
        s => s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term)
      );
    }
    if (filter === 'goals') {
      const studentIds = campusData.goals.filter(g => g.status === 'pending').map(g => g.student_id);
      students = students.filter(s => studentIds.includes(s.id));
    } else if (filter === 'reflections') {
      const studentIds = campusData.reflections.filter(r => r.status === 'pending').map(r => r.student_id);
      students = students.filter(s => studentIds.includes(s.id));
    }

    // Sort students: those with pending items first
    students.sort((a, b) => {
      const aPendingGoals = campusData.goals.filter(g => g.student_id === a.id && g.status === 'pending').length;
      const aPendingReflections = campusData.reflections.filter(r => r.student_id === a.id && r.status === 'pending').length;
      const bPendingGoals = campusData.goals.filter(g => g.student_id === b.id && g.status === 'pending').length;
      const bPendingReflections = campusData.reflections.filter(r => r.student_id === b.id && r.status === 'pending').length;

      const aTotalPending = aPendingGoals + aPendingReflections;
      const bTotalPending = bPendingGoals + bPendingReflections;

      // Sort by pending count (descending), then by name
      if (aTotalPending !== bTotalPending) {
        return bTotalPending - aTotalPending;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    return students;
  }, [campusData, debouncedSearchTerm, filter]);

  // Pagination
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, page]);

  // Summary counts
  const totalStudents = campusData?.students.length || 0;
  const goalsToReview = campusData?.goals.filter(g => g.status === 'pending').length || 0;
  const reflectionsToReview = campusData?.reflections.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {selectedUser ? (
        // Detailed User View
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={goBackToList}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Students</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedUser.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">{selectedUser.email}</p>
              </div>
            </div>
            <button onClick={() => selectedUser && selectUser(selectedUser)} className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 text-sm sm:text-base">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> 
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>

          {userLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group goals and reflections by date */}
              {(() => {
                const dateGroups: { [date: string]: { goals: DailyGoal[], reflections: DailyReflection[] } } = {};

                userGoals.forEach(goal => {
                  const date = new Date(goal.created_at).toDateString();
                  if (!dateGroups[date]) dateGroups[date] = { goals: [], reflections: [] };
                  dateGroups[date].goals.push(goal);
                });

                userReflections.forEach(reflection => {
                  const date = new Date(reflection.created_at).toDateString();
                  if (!dateGroups[date]) dateGroups[date] = { goals: [], reflections: [] };
                  dateGroups[date].reflections.push(reflection);
                });

                return Object.entries(dateGroups)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([date, { goals, reflections }]) => (
                    <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Goals for this date - sorted by status (pending first) */}
                        {goals
                          .sort((a, b) => {
                            if (a.status === 'pending' && b.status !== 'pending') return -1;
                            if (a.status !== 'pending' && b.status === 'pending') return 1;
                            return 0;
                          })
                          .map(goal => (
                          <div key={goal.id} className={`border-l-4 rounded-r-lg p-4 ${
                            goal.status === 'pending'
                              ? 'border-l-yellow-400 bg-yellow-50'
                              : goal.status === 'approved'
                              ? 'border-l-green-400 bg-green-50'
                              : 'border-l-blue-400 bg-blue-50'
                          }`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Target className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-gray-900">Goal</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  goal.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  goal.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {goal.status}
                                </span>
                              </div>
                              {canApprove(selectedUser.id) && goal.status === 'pending' && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => handleGoalApproval(goal.id, 'approved')}
                                    className="flex items-center justify-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleGoalApproval(goal.id, 'reviewed')}
                                    className="flex items-center justify-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>Review</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-700 mb-2">{goal.goal_text}</p>
                            <div className="text-sm text-gray-600">
                              Target: {goal.target_percentage}%
                              {goal.mentor_comment && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
                                  <strong>Mentor feedback:</strong> {goal.mentor_comment}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Reflections for this date - sorted by status (pending first) */}
                        {reflections
                          .sort((a, b) => {
                            if (a.status === 'pending' && b.status !== 'pending') return -1;
                            if (a.status !== 'pending' && b.status === 'pending') return 1;
                            return 0;
                          })
                          .map(reflection => (
                          <div key={reflection.id} className={`border-l-4 rounded-r-lg p-4 ${
                            reflection.status === 'pending'
                              ? 'border-l-yellow-400 bg-yellow-50'
                              : reflection.status === 'approved'
                              ? 'border-l-green-400 bg-green-50'
                              : 'border-l-blue-400 bg-blue-50'
                          }`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <MessageSquare className="h-5 w-5 text-purple-600" />
                                <span className="font-medium text-gray-900">Reflection</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  reflection.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  reflection.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {reflection.status}
                                </span>
                              </div>
                              {canApprove(selectedUser.id) && reflection.status === 'pending' && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => handleReflectionApproval(reflection.id, 'approved')}
                                    className="flex items-center justify-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleReflectionApproval(reflection.id, 'reviewed')}
                                    className="flex items-center justify-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>Review</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="bg-green-50 p-3 rounded">
                                <strong className="text-green-800">What worked well:</strong>
                                <p className="text-green-700 mt-1">{reflection.reflection_answers.workedWell}</p>
                              </div>
                              <div className="bg-blue-50 p-3 rounded">
                                <strong className="text-blue-800">How achieved:</strong>
                                <p className="text-blue-700 mt-1">{reflection.reflection_answers.howAchieved}</p>
                              </div>
                              <div className="bg-purple-50 p-3 rounded">
                                <strong className="text-purple-800">Key learning:</strong>
                                <p className="text-purple-700 mt-1">{reflection.reflection_answers.keyLearning}</p>
                              </div>
                              <div className="bg-orange-50 p-3 rounded">
                                <strong className="text-orange-800">Challenges:</strong>
                                <p className="text-orange-700 mt-1">{reflection.reflection_answers.challenges}</p>
                              </div>
                            </div>

                            <div className="text-sm text-gray-600 mb-2">
                              Achieved: {reflection.achieved_percentage}%
                            </div>

                            {reflection.mentor_notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded">
                                <strong className="text-blue-800">Mentor feedback:</strong>
                                <p className="text-blue-700 mt-1">{reflection.mentor_notes}</p>
                                {reflection.mentor_assessment && (
                                  <p className="text-sm text-blue-600 mt-1">
                                    Assessment: {reflection.mentor_assessment.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          )}
        </div>
      ) : (
        // Student List View
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-1">
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center space-x-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setFilter('all')}>
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{totalStudents}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center space-x-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setFilter('goals')}>
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Goals to Review</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{goalsToReview}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center space-x-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setFilter('reflections')}>
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Reflections to Review</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{reflectionsToReview}</p>
                </div>
              </div>
            </div>
            <button onClick={handleRefresh} className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 text-sm sm:text-base self-start sm:self-auto">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> 
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>

          <div className="mb-4 flex items-center">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                placeholder="Search students..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <StudentCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedStudents.map(student => {
                  const studentGoals = campusData?.goals.filter(g => g.student_id === student.id) || [];
                  const studentReflections = campusData?.reflections.filter(r => r.student_id === student.id) || [];
                  const pendingGoals = studentGoals.filter(g => g.status === 'pending');
                  const pendingReflections = studentReflections.filter(r => r.status === 'pending');
                  const hasPendingItems = pendingGoals.length > 0 || pendingReflections.length > 0;

                  return (
                    <div key={student.id} className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                      hasPendingItems ? 'border-l-yellow-400 bg-yellow-50' : 'border-l-gray-200'
                    }`} onClick={() => selectUser(student)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-lg text-gray-900">{student.name}</div>
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{student.email}</div>
                      <div className="flex items-center space-x-4 text-sm mb-2">
                        <span className={`flex items-center space-x-1 ${
                          pendingGoals.length > 0 ? 'text-yellow-700 font-medium' : 'text-gray-600'
                        }`}>
                          <Target className="h-4 w-4 text-green-600" />
                          <span>{pendingGoals.length} pending</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${
                          pendingReflections.length > 0 ? 'text-yellow-700 font-medium' : 'text-gray-600'
                        }`}>
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                          <span>{pendingReflections.length} pending</span>
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Click to view all goals and reflections
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2 sm:px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 text-sm sm:text-base"
                >Prev</button>
                <span className="text-sm sm:text-base">Page {page} of {Math.ceil(filteredStudents.length / PAGE_SIZE) || 1}</span>
                <button
                  disabled={page * PAGE_SIZE >= filteredStudents.length}
                  onClick={() => setPage(page + 1)}
                  className="px-2 sm:px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 text-sm sm:text-base"
                >Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorCampusTab;
