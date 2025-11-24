import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Star, Users, UserCircle, TrendingUp } from 'lucide-react';
import { MentorReviewService, MenteeReviewService } from '../services/dataServices';
import { UserService } from '../services/firestore';
import { User, MentorReview, MenteeReview } from '../types';
import { calculateReviewScore } from '../utils/reviewCalculations';
import { getCurrentWeekStart } from '../utils/reviewDateUtils';

interface PersonToReview {
  id: string;
  name: string;
  email: string;
  latestScore: number | null;
  hasReviewedThisWeek: boolean;
}

const ReviewsPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'mentor' | 'mentees'>('mentor');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [mentorData, setMentorData] = useState<User | null>(null);
  const [myMentees, setMyMentees] = useState<User[]>([]);
  const [mentorReviews, setMentorReviews] = useState<MentorReview[]>([]);
  const [menteeReviews, setMenteeReviews] = useState<Map<string, MenteeReview>>(new Map());

  useEffect(() => {
    loadReviewData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const loadReviewData = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      // Load mentor
      if (userData.mentor_id) {
        const mentor = await UserService.getUserById(userData.mentor_id);
        setMentorData(mentor);
        
        // Load mentor reviews
        const reviews = await MentorReviewService.getReviewsByMentor(userData.mentor_id);
        setMentorReviews(reviews as MentorReview[]);
      }

      // Load mentees (students assigned to me)
      const mentees = await UserService.getStudentsByMentor(userData.id);
      setMyMentees(mentees);

      // Load mentee reviews
      const reviewsMap = new Map<string, MenteeReview>();
      for (const mentee of mentees) {
        try {
          const review = await MenteeReviewService.getLatestReview(mentee.id);
          if (review) {
            reviewsMap.set(mentee.id, review as MenteeReview);
          }
        } catch (error) {
          console.error(`Error loading review for mentee ${mentee.id}:`, error);
        }
      }
      setMenteeReviews(reviewsMap);
    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasReviewedMentorThisWeek = () => {
    if (!mentorData || !userData) return false;
    const weekStart = getCurrentWeekStart();
    return mentorReviews.some(review => {
      const reviewWeekStart = review.week_start instanceof Date 
        ? review.week_start 
        : new Date(review.week_start);
      return reviewWeekStart.getTime() >= weekStart.getTime() && 
             review.student_id === userData.id;
    });
  };

  const hasReviewedMenteeThisWeek = (menteeId: string) => {
    const review = menteeReviews.get(menteeId);
    if (!review) return false;
    const weekStart = getCurrentWeekStart();
    const reviewWeekStart = review.week_start instanceof Date 
      ? review.week_start 
      : new Date(review.week_start);
    return reviewWeekStart.getTime() >= weekStart.getTime();
  };

  const getLatestMentorScore = () => {
    const myReviews = mentorReviews.filter(r => r.student_id === userData?.id);
    if (myReviews.length === 0) return null;
    const latest = myReviews.sort((a, b) => {
      const dateA = a.week_start instanceof Date ? a.week_start : new Date(a.week_start);
      const dateB = b.week_start instanceof Date ? b.week_start : new Date(b.week_start);
      return dateB.getTime() - dateA.getTime();
    })[0];
    return calculateReviewScore(latest);
  };

  // Calculate review streak
  const getMentorReviewStreak = () => {
    const myReviews = mentorReviews
      .filter(r => r.student_id === userData?.id)
      .sort((a, b) => {
        const dateA = a.week_start instanceof Date ? a.week_start : new Date(a.week_start);
        const dateB = b.week_start instanceof Date ? b.week_start : new Date(b.week_start);
        return dateB.getTime() - dateA.getTime();
      });
    
    if (myReviews.length === 0) return 0;
    
    let streak = 1;
    for (let i = 0; i < myReviews.length - 1; i++) {
      const current = new Date(myReviews[i].week_start);
      const next = new Date(myReviews[i + 1].week_start);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) streak++;
      else break;
    }
    return streak;
  };

  // Calculate trend (comparing last 2 reviews)
  const getMentorTrend = () => {
    const myReviews = mentorReviews
      .filter(r => r.student_id === userData?.id)
      .sort((a, b) => {
        const dateA = a.week_start instanceof Date ? a.week_start : new Date(a.week_start);
        const dateB = b.week_start instanceof Date ? b.week_start : new Date(b.week_start);
        return dateB.getTime() - dateA.getTime();
      });
    
    if (myReviews.length < 2) return 'neutral';
    const latest = calculateReviewScore(myReviews[0]);
    const previous = calculateReviewScore(myReviews[1]);
    if (latest > previous) return 'up';
    if (latest < previous) return 'down';
    return 'neutral';
  };

  // Get mentee trend
  const getMenteeTrend = (menteeId: string) => {
    // For now, return neutral since we only have latest review
    // In future, fetch multiple reviews per mentee
    return 'neutral';
  };

  // Calculate days until review deadline (Sunday end of week)
  const getDaysUntilDeadline = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    return daysUntilSunday;
  };

  // Format date for graph labels
  const formatWeekLabel = (weekStart: Date | any) => {
    const date = weekStart instanceof Date ? weekStart : new Date(weekStart);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
              <Star className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Performance Reviews</h1>
              <p className="text-purple-100 mt-2">Review your mentor and mentees weekly</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('mentor')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-opacity-20 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Mentor to Review</p>
                  <p className="text-2xl font-bold">{mentorData ? 1 : 0}</p>
                </div>
                <UserCircle className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div 
              onClick={() => setActiveTab('mentees')}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-opacity-20 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Mentees to Review</p>
                  <p className="text-2xl font-bold">{myMentees.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">This Week</p>
                  <p className="text-2xl font-bold">
                    {(hasReviewedMentorThisWeek() ? 1 : 0) + 
                     myMentees.filter(m => hasReviewedMenteeThisWeek(m.id)).length}
                    /{(mentorData ? 1 : 0) + myMentees.length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Insights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-9 mb-5">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📊</span>
            Your Review Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Streak */}
            {getMentorReviewStreak() > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <p className="text-sm text-gray-600">Review Streak</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {getMentorReviewStreak()} {getMentorReviewStreak() === 1 ? 'week' : 'weeks'}!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Trend */}
            {getMentorTrend() !== 'neutral' && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{getMentorTrend() === 'up' ? '📈' : '📉'}</span>
                  <div>
                    <p className="text-sm text-gray-600">Mentor Rating</p>
                    <p className={`text-lg font-bold ${getMentorTrend() === 'up' ? 'text-green-600' : 'text-orange-600'}`}>
                      {getMentorTrend() === 'up' ? 'Improving!' : 'Attention needed'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Completion Status */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="text-3xl">
                  {hasReviewedMentorThisWeek() && myMentees.every(m => hasReviewedMenteeThisWeek(m.id)) ? '✅' : '⏰'}
                </span>
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-lg font-bold text-purple-600">
                    {hasReviewedMentorThisWeek() && myMentees.every(m => hasReviewedMenteeThisWeek(m.id)) 
                      ? 'All done!' 
                      : `${getDaysUntilDeadline()} day${getDaysUntilDeadline() === 1 ? '' : 's'} left`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends Graph */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            Review Performance Trends
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mentor Reviews Chart */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">My Mentor's Performance</h4>
              {mentorReviews.filter(r => r.student_id === userData?.id).length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Reviews:</span>
                    <span className="font-bold text-purple-600">
                      {mentorReviews.filter(r => r.student_id === userData?.id).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Latest Score:</span>
                    <span className="font-bold text-purple-600">
                      {getLatestMentorScore()?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average Score:</span>
                    <span className="font-bold text-purple-600">
                      {mentorReviews.filter(r => r.student_id === userData?.id).length > 0
                        ? (mentorReviews
                            .filter(r => r.student_id === userData?.id)
                            .reduce((sum, r) => sum + calculateReviewScore(r), 0) /
                           mentorReviews.filter(r => r.student_id === userData?.id).length
                          ).toFixed(1)
                        : 'N/A'}
                    </span>
                  </div>
                  {/* Simple bar chart */}
                  <div className="mt-4 space-y-2">
                    {mentorReviews
                      .filter(r => r.student_id === userData?.id)
                      .slice(-5)
                      .reverse()
                      .map((review, idx) => {
                        const score = calculateReviewScore(review);
                        const percentage = (score / 2) * 100; // Assuming max score is 2
                        return (
                          <div 
                            key={idx} 
                            className="flex items-center space-x-2 group cursor-pointer hover:bg-purple-100 hover:bg-opacity-50 rounded-lg p-1 transition-all"
                            title={`Review from ${formatWeekLabel(review.week_start)} - Score: ${score.toFixed(2)}/2.0`}
                          >
                            <span className="text-xs text-gray-500 w-14 sm:w-16 font-medium">
                              {formatWeekLabel(review.week_start)}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 shadow-inner">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-purple-500 h-6 rounded-full transition-all group-hover:from-purple-700 group-hover:to-purple-600"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-purple-700 w-12">
                              {score.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No mentor reviews yet</p>
              )}
            </div>

            {/* Mentee Reviews Chart */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">My Mentees' Performance</h4>
              {Array.from(menteeReviews.values()).length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Reviews:</span>
                    <span className="font-bold text-blue-600">
                      {Array.from(menteeReviews.values()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average Score:</span>
                    <span className="font-bold text-blue-600">
                      {Array.from(menteeReviews.values()).length > 0
                        ? (Array.from(menteeReviews.values())
                            .reduce((sum, r) => sum + calculateReviewScore(r), 0) /
                           Array.from(menteeReviews.values()).length
                          ).toFixed(1)
                        : 'N/A'}
                    </span>
                  </div>
                  {/* Mentee-wise bars */}
                  <div className="mt-4 space-y-2">
                    {myMentees.slice(0, 5).map((mentee) => {
                      const review = menteeReviews.get(mentee.id);
                      const score = review ? calculateReviewScore(review) : 0;
                      const percentage = (score / 2) * 100;
                      return (
                        <div 
                          key={mentee.id} 
                          className="flex items-center space-x-2 group cursor-pointer hover:bg-blue-100 hover:bg-opacity-50 rounded-lg p-1 transition-all"
                          title={`${mentee.name} - Latest Score: ${review ? score.toFixed(2) : 'Not reviewed yet'}`}
                        >
                          <span className="text-xs text-gray-500 w-16 sm:w-20 truncate font-medium" title={mentee.name}>
                            {mentee.name.split(' ')[0]}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-blue-500 h-6 rounded-full transition-all group-hover:from-blue-700 group-hover:to-blue-600"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-blue-700 w-12">
                            {review ? score.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      );
                    })}
                    {myMentees.length > 5 && (
                      <p className="text-xs text-gray-500 italic text-center mt-2">
                        +{myMentees.length - 5} more mentees
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No mentee reviews yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm border-b border-gray-200 rounded-t-lg">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('mentor')}
              className={`w-full sm:w-auto text-center px-4 py-3 sm:px-6 sm:py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'mentor'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span>My Mentor</span>
                {mentorData && !hasReviewedMentorThisWeek() && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Due</span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('mentees')}
              className={`w-full sm:w-auto text-center px-4 py-3 sm:px-6 sm:py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'mentees'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>My Mentees ({myMentees.length})</span>
                {myMentees.some(m => !hasReviewedMenteeThisWeek(m.id)) && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {myMentees.filter(m => !hasReviewedMenteeThisWeek(m.id)).length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-8">
          {activeTab === 'mentor' ? (
            // Mentor Tab
            <div>
{mentorData ? (
                <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <div className="flex items-start sm:items-center space-x-4 min-w-0">
                      <div className="relative w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-600">
                          {mentorData.name.charAt(0).toUpperCase()}
                        </span>
                        {/* Streak indicator */}
                        {getMentorReviewStreak() >= 3 && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            🔥
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-semibold text-gray-900 truncate">{mentorData.name}</h3>
                          {/* Trend indicator */}
                          {getMentorTrend() === 'up' && (
                            <span className="text-green-600 text-xl" title="Performance improving">↗️</span>
                          )}
                          {getMentorTrend() === 'down' && (
                            <span className="text-orange-600 text-xl" title="Needs attention">↘️</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{mentorData.email}</p>
                        <div className="flex items-center space-x-3 mt-2 flex-wrap gap-2">
                          {hasReviewedMentorThisWeek() ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Reviewed this week
                            </span>
                          ) : getDaysUntilDeadline() === 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                              ⚠️ Due today!
                            </span>
                          ) : getDaysUntilDeadline() <= 2 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                              ⏰ {getDaysUntilDeadline()} day{getDaysUntilDeadline() === 1 ? '' : 's'} left
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              � {getDaysUntilDeadline()} days left
                            </span>
                          )}
                          {getLatestMentorScore() !== null && (
                            <>
                              {(() => {
                                const score = getLatestMentorScore()!;
                                const colorClass = score >= 1.7 ? 'text-green-600 bg-green-100' : 
                                                  score >= 1.3 ? 'text-yellow-600 bg-yellow-100' : 
                                                  'text-red-600 bg-red-100';
                                return (
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                                    ⭐ {score.toFixed(1)}/2.0
                                  </span>
                                );
                              })()}
                            </>
                          )}
                          {getMentorReviewStreak() > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              🔥 {getMentorReviewStreak()}-week streak
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/mentor/mentee/${mentorData.id}`)}
                      className="mt-4 sm:mt-0 px-4 py-2 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2 hover:scale-105 transform flex-shrink-0"
                    >
                      <Star className="h-5 w-5" />
                      <span>Review Mentor</span>
                    </button>
                  </div>
                </div>
) : (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-sm border-2 border-dashed border-purple-300 p-16 text-center">
                  <div className="mb-6">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCircle className="h-14 w-14 text-purple-400" />
                    </div>
                    <div className="text-6xl mb-4">🎓</div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Mentor Assigned Yet</h3>
                  <p className="text-gray-600 mb-2 max-w-md mx-auto">
                    A mentor will guide you through your learning journey and help you grow.
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    Contact your admin to get paired with a mentor who matches your goals.
                  </p>
                  <button
                    onClick={() => navigate('/student/dashboard')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Mentees Tab
            <div>
              {myMentees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{myMentees.map((mentee) => {
                    const hasReviewed = hasReviewedMenteeThisWeek(mentee.id);
                    const latestReview = menteeReviews.get(mentee.id);
                    const latestScore = latestReview ? calculateReviewScore(latestReview) : null;
                    const trend = getMenteeTrend(mentee.id);

                    return (
                      <div
                        key={mentee.id}
                        className="bg-white rounded-lg shadow-sm border-l-4 border-indigo-500 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-indigo-600">
                                {mentee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">{mentee.name}</h3>
                                {trend === 'up' && (
                                  <span className="text-green-600 text-lg" title="Performance improving">↗️</span>
                                )}
                                {trend === 'down' && (
                                  <span className="text-orange-600 text-lg" title="Needs attention">↘️</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">{mentee.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex flex-col space-y-2">
                            {hasReviewed ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Reviewed this week
                              </span>
                            ) : getDaysUntilDeadline() === 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                                ⚠️ Due today!
                              </span>
                            ) : getDaysUntilDeadline() <= 2 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                                ⏰ {getDaysUntilDeadline()} day{getDaysUntilDeadline() === 1 ? '' : 's'} left
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                � {getDaysUntilDeadline()} days left
                              </span>
                            )}
                            {latestScore !== null && (
                              <>
                                {(() => {
                                  const colorClass = latestScore >= 1.7 ? 'text-green-600 bg-green-100' : 
                                                    latestScore >= 1.3 ? 'text-yellow-600 bg-yellow-100' : 
                                                    'text-red-600 bg-red-100';
                                  return (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                                      ⭐ {latestScore.toFixed(1)}/2.0
                                    </span>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/mentor/mentee/${mentee.id}`)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2 hover:scale-105 transform flex-shrink-0"
                          >
                            <Star className="h-4 w-4" />
                            <span>Review</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
) : (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-sm border-2 border-dashed border-indigo-300 p-16 text-center">
                  <div className="mb-6">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-14 w-14 text-indigo-400" />
                    </div>
                    <div className="text-6xl mb-4">👥</div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Mentees Yet</h3>
                  <p className="text-gray-600 mb-2 max-w-md mx-auto">
                    You'll be assigned mentees to guide and review as they grow.
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    When mentees are assigned, you'll see them here and can provide weekly feedback.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => navigate('/mentor/dashboard')}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Mentor Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
