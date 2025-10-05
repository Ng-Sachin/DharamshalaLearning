import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, FileText, Calendar, UserCheck, Search } from 'lucide-react';
import { AttendanceTrackingService, DailyAttendanceStats, MenteeInfo } from '../../services/attendanceTrackingService';
import { useAuth } from '../../contexts/AuthContext';

interface AttendanceDashboardProps {
  className?: string;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ className = '' }) => {
  const { userData } = useAuth();
  const [stats, setStats] = useState<DailyAttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCampus, setSelectedCampus] = useState<string>(userData?.campus || 'all');
  const [mentees, setMentees] = useState<MenteeInfo[]>([]);
  const [menteeSearchTerm, setMenteeSearchTerm] = useState('');
  const [showMentees, setShowMentees] = useState(false);
  const [loadingMentees, setLoadingMentees] = useState(false);

  // Available campuses
  const campuses = [
    'all',
    'Dantewada',
    'Dharamshala', 
    'Eternal',
    'Jashpur',
    'Kishanganj',
    'Pune',
    'Raigarh',
    'Sarjapura'
  ];

  // Set up real-time tracking
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupTracking = async () => {
      setLoading(true);
      try {
        // Initial load
        const initialStats = await AttendanceTrackingService.getDailyStats(
          selectedDate, 
          selectedCampus === 'all' ? undefined : selectedCampus
        );
        setStats(initialStats);

        // Set up real-time tracking
        unsubscribe = AttendanceTrackingService.setupRealtimeAttendanceTracking(
          selectedDate,
          selectedCampus === 'all' ? undefined : selectedCampus,
          (updatedStats) => {
            setStats(updatedStats);
          }
        );
      } catch (error) {
        console.error('Error setting up attendance tracking:', error);
      } finally {
        setLoading(false);
      }
    };

    setupTracking();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedDate, selectedCampus]);

  const loadMentees = useCallback(async () => {
    setLoadingMentees(true);
    try {
      const campusFilter = selectedCampus === 'all' ? userData?.campus : selectedCampus;
      const menteesList = await AttendanceTrackingService.getMenteesList(
        campusFilter,
        menteeSearchTerm
      );
      setMentees(menteesList);
    } catch (error) {
      console.error('Error loading mentees:', error);
    } finally {
      setLoadingMentees(false);
    }
  }, [selectedCampus, menteeSearchTerm, userData?.campus]);

  // Load mentees when section is opened
  useEffect(() => {
    if (showMentees) {
      loadMentees();
    }
  }, [showMentees, loadMentees]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(event.target.value));
  };

  const handleCampusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCampus(event.target.value);
  };

  if (loading && !stats) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    {
      title: 'Total Students',
      value: stats.totalActiveStudents,
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      subtext: `${stats.studentsOnLeave} on leave`
    },
    {
      title: 'Goals Approved',
      value: stats.studentsWithApprovedGoals,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      percentage: stats.goalApprovalRate,
      subtext: `${stats.goalApprovalRate.toFixed(1)}% approval rate`
    },
    {
      title: 'Reflections Submitted',
      value: stats.studentsWithSubmittedReflections,
      icon: FileText,
      color: 'bg-purple-100 text-purple-800',
      percentage: stats.reflectionSubmissionRate,
      subtext: `${stats.reflectionSubmissionRate.toFixed(1)}% submission rate`
    },
    {
      title: 'Students Present',
      value: stats.studentsPresent,
      icon: UserCheck,
      color: 'bg-emerald-100 text-emerald-800',
      percentage: stats.attendanceRate,
      subtext: `${stats.attendanceRate.toFixed(1)}% attendance rate`
    }
  ] : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Daily Attendance Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Daily Attendance Tracking
            </h3>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Picker */}
              <div className="flex items-center">
                <label htmlFor="date-picker" className="sr-only">Select Date</label>
                <input
                  id="date-picker"
                  type="date"
                  value={formatDate(selectedDate)}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              {/* Campus Filter */}
              <div className="flex items-center">
                <label htmlFor="campus-filter" className="sr-only">Select Campus</label>
                <select
                  id="campus-filter"
                  value={selectedCampus}
                  onChange={handleCampusChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  {campuses.map(campus => (
                    <option key={campus} value={campus}>
                      {campus === 'all' ? 'All Campuses' : campus}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className={`rounded-md p-2 ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                        {stat.percentage !== undefined && (
                          <p className="ml-2 text-sm text-gray-500">
                            ({stat.percentage.toFixed(1)}%)
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{stat.subtext}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bars */}
          {stats && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Goal Approval Progress</span>
                  <span>{stats.goalApprovalRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stats.goalApprovalRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Attendance</span>
                  <span>{stats.attendanceRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Mentees Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              My Mentees (Admin Override)
            </h3>
            <button
              onClick={() => setShowMentees(!showMentees)}
              className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
            >
              {showMentees ? 'Hide' : 'Show'} Mentees
            </button>
          </div>
        </div>

        {showMentees && (
          <div className="p-6">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search mentees by name or email..."
                  value={menteeSearchTerm}
                  onChange={(e) => setMenteeSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Mentees List */}
            {loadingMentees ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading mentees...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mentees.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No mentees found.</p>
                ) : (
                  mentees.map((menteeInfo) => (
                    <div key={menteeInfo.student.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {menteeInfo.student.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">
                              {menteeInfo.student.name}
                            </h4>
                            <p className="text-sm text-gray-500">{menteeInfo.student.email}</p>
                            {menteeInfo.mentor && (
                              <p className="text-xs text-gray-400">
                                Mentor: {menteeInfo.mentor.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {menteeInfo.attendanceRate.toFixed(1)}% Attendance
                          </div>
                          <div className="text-xs text-gray-500">
                            {menteeInfo.recentGoals.length} goals, {menteeInfo.recentReflections.length} reflections
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboard;