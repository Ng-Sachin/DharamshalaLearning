import React, { useEffect, useState, useRef } from 'react';
import { X, Search, Filter, UserCheck, Star, AlertCircle, Users, Loader } from 'react-feather';
import MentorListSkeleton from './MentorListSkeleton';
import { MentorshipService } from '../../services/dataServices';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../hooks/useModal';
import { MentorWithCapacity } from '../../types';

interface MentorBrowserProps {
  currentStudentId: string;
  currentMentorId?: string;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

const ITEMS_PER_PAGE = 10;

const MentorBrowser: React.FC<MentorBrowserProps> = ({ 
  currentStudentId, 
  currentMentorId, 
  onClose, 
  onRequestSubmitted 
}) => {
  const { userData } = useAuth();
  const [allMentors, setAllMentors] = useState<MentorWithCapacity[]>([]);
  const [visibleMentors, setVisibleMentors] = useState<MentorWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [campusFilter, setCampusFilter] = useState<string>(userData?.campus || 'all');
  const [houseFilter, setHouseFilter] = useState<string>(userData?.house || 'all');
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Modal functionality - always open when component is rendered
  const { modalRef, contentRef, handleOutsideClick, handleContentClick } = useModal(true, onClose);

  // Check for pending mentor requests
  useEffect(() => {
    const checkPendingRequest = async () => {
      try {
        const requests = await MentorshipService.getStudentMentorRequests(currentStudentId);
        const pending = requests.some(r => r.status === 'pending');
        setHasPendingRequest(pending);
      } catch (error) {
        console.error('Error checking pending requests:', error);
      }
    };

    checkPendingRequest();
  }, [currentStudentId]);

  // Load initial page of mentors when component mounts
  useEffect(() => {
    const loadInitialMentors = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      setSelectedMentor(null);
      setReason('');
      try {
        console.log('🔍 [MentorBrowser] Loading initial page of mentors...');
        const result = await MentorshipService.getMentorsWithCapacityPaginated(ITEMS_PER_PAGE);
        console.log(`✅ [MentorBrowser] Received ${result.mentors.length} mentors, hasMore: ${result.hasMore}`);
        
        const filtered = result.mentors.filter(m => m.mentor.id !== currentStudentId);
        console.log(`✅ [MentorBrowser] Filtered mentors (excluding self): ${filtered.length}`);
        
        setAllMentors(filtered);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        
        if (filtered.length === 0) {
          setError('No mentors available at the moment.');
        }
      } catch (error) {
        console.error('❌ [MentorBrowser] Error loading mentors:', error);
        setError('Failed to load mentors. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialMentors();
  }, [currentStudentId]);

  // Load more mentors when scrolling
  const loadMoreMentors = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    
    setLoadingMore(true);
    try {
      console.log('🔍 [MentorBrowser] Loading more mentors...');
      const result = await MentorshipService.getMentorsWithCapacityPaginated(ITEMS_PER_PAGE, lastDoc);
      console.log(`✅ [MentorBrowser] Received ${result.mentors.length} more mentors, hasMore: ${result.hasMore}`);
      
      const filtered = result.mentors.filter(m => m.mentor.id !== currentStudentId);
      setAllMentors(prev => [...prev, ...filtered]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('❌ [MentorBrowser] Error loading more mentors:', error);
      setError('Failed to load more mentors.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Apply client-side filters
  useEffect(() => {
    let filtered = [...allMentors];
    if (userData?.current_phase_id && Number(userData.current_phase_id) > 0) {
      const studentPhase = Number(userData.current_phase_id);
      filtered = filtered.filter(m => Number(m.mentor.current_phase_id) > studentPhase);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.mentor.name.toLowerCase().includes(search) ||
        m.mentor.email.toLowerCase().includes(search)
      );
    }
    if (campusFilter !== 'all') {
      filtered = filtered.filter(m => m.mentor.campus === campusFilter);
    }
    if (houseFilter !== 'all') {
      filtered = filtered.filter(m => m.mentor.house === houseFilter);
    }
    setVisibleMentors(filtered);
  }, [allMentors, userData, searchTerm, campusFilter, houseFilter]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current || loading || loadingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMoreMentors();
      }
    };
    const ref = listRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, hasMore, lastDoc]);

  const handleRequestMentor = async () => {
    if (!selectedMentor) {
      setError('Please select a mentor');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the mentor change request');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    console.log('🚀 MentorBrowser: Starting mentor request submission', {
      currentStudentId,
      selectedMentor,
      currentMentorId,
      reason: reason.substring(0, 50) + '...'
    });
    
    try {
      // Pass parameters in correct order: studentId, requestedMentorId, currentMentorId, reason
      const requestId = await MentorshipService.requestMentorChange(
        currentStudentId, 
        selectedMentor, 
        currentMentorId,
        reason
      );
      
      console.log('✅ MentorBrowser: Request submitted successfully', { requestId });
      setSuccess('Mentor change request submitted successfully');
      setSelectedMentor(null);
      setReason('');
      setTimeout(() => {
        onRequestSubmitted();
      }, 1500);
    } catch (err) {
      console.error('❌ MentorBrowser: Error submitting mentor request:', err);
      setError('Failed to submit mentor change request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOutsideClick}
    >
      <div
        ref={contentRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={handleContentClick}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Browse Mentors</h2>
            {hasPendingRequest && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Change request pending
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <div className="px-6 pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search mentors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Toggle filter options"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Campuses</option>
                  <option value="Dantewada">Dantewada</option>
                  <option value="Dharamshala">Dharamshala</option>
                  <option value="Eternal">Eternal</option>
                  <option value="Jashpur">Jashpur</option>
                  <option value="Kishanganj">Kishanganj</option>
                  <option value="Pune">Pune</option>
                  <option value="Raigarh">Raigarh</option>
                  <option value="Sarjapura">Sarjapura</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">House</label>
                <select
                  value={houseFilter}
                  onChange={(e) => setHouseFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Houses</option>
                  <option value="Bageshree">Bageshree</option>
                  <option value="Malhar">Malhar</option>
                  <option value="Bhairav">Bhairav</option>
                </select>
              </div>
            </div>
          )}
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto p-6" style={{ minHeight: 300 }}>
          {loading ? (
            <MentorListSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
            </div>
          ) : visibleMentors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No mentors found matching your criteria.</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleMentors.map((mentorInfo) => {
                  const isCurrentMentor = mentorInfo.mentor.id === currentMentorId;
                  const hasSlots = mentorInfo.available_slots > 0;
                  const isSelected = selectedMentor === mentorInfo.mentor.id;
                  const isOnLeave = mentorInfo.mentor.leave_from && mentorInfo.mentor.leave_to && 
                    new Date(mentorInfo.mentor.leave_from) <= new Date() && 
                    new Date(mentorInfo.mentor.leave_to) >= new Date();
                  return (
                    <div
                      key={mentorInfo.mentor.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : isCurrentMentor
                          ? 'border-blue-200 bg-blue-50'
                          : hasSlots && !isOnLeave
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                      onClick={() => {
                        if (hasSlots && !isCurrentMentor && !isOnLeave) {
                          setSelectedMentor(mentorInfo.mentor.id);
                        }
                      }}
                      title={hasSlots && !isCurrentMentor && !isOnLeave ? 'Click to select this mentor' : isCurrentMentor ? 'This is your current mentor' : !hasSlots ? 'No slots available' : 'Mentor is on leave'}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{mentorInfo.mentor.name}</h3>
                            <p className="text-sm text-gray-500">{mentorInfo.mentor.email}</p>
                          </div>
                          {isCurrentMentor && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Current</span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Phase:</span>
                            <span>{mentorInfo.mentor.current_phase_id || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Campus:</span>
                            <span>{mentorInfo.mentor.campus}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">House:</span>
                            <span>{mentorInfo.mentor.house}</span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${
                          isOnLeave ? 'text-orange-600' : hasSlots ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isOnLeave ? (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              <span>On Leave</span>
                            </>
                          ) : hasSlots ? (
                            <>
                              <Star className="h-4 w-4" />
                              <span>{mentorInfo.available_slots} slot(s) available</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              <span>No slots available</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {loadingMore && (
                <div className="flex justify-center items-center py-4 mt-4">
                  <Loader className="h-6 w-6 animate-spin text-primary-500" />
                  <span className="ml-2 text-gray-500 text-sm">Loading more mentors...</span>
                </div>
              )}
            </>
          )}
        </div>
        {selectedMentor && (
          <div className="border-t px-6 py-4 space-y-4 bg-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for mentor change request</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you want to change your mentor..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Close mentor request dialog"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestMentor}
                disabled={submitting || !reason.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send mentor request to selected mentor"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorBrowser;
