import React, { useState, useEffect } from 'react';
import { MentorshipService } from '../../services/dataServices';
import { MentorWithCapacity } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { MentorListSkeleton } from '../Common/SkeletonLoader';
import { 
  X, 
  Star, 
  Users, 
  CheckCircle, 
  AlertCircle,
  UserCheck,
  Loader,
  Search,
  Filter,
  Home,
  Building2,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MentorBrowserProps {
  currentStudentId: string;
  currentMentorId?: string;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

const MentorBrowser: React.FC<MentorBrowserProps> = ({
  currentStudentId,
  currentMentorId,
  onClose,
  onRequestSubmitted
}) => {
  const { userData } = useAuth();
  const [mentors, setMentors] = useState<MentorWithCapacity[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorWithCapacity[]>([]);
  const [paginatedMentors, setPaginatedMentors] = useState<MentorWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Filter states - Initialize with user's campus and house
  const [searchTerm, setSearchTerm] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>(userData?.campus || 'all');
  const [houseFilter, setHouseFilter] = useState<string>(userData?.house || 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Temporary filter states for mobile UX (to prevent immediate filtering)
  const [tempCampusFilter, setTempCampusFilter] = useState<string>(userData?.campus || 'all');
  const [tempHouseFilter, setTempHouseFilter] = useState<string>(userData?.house || 'all');
  const [tempAvailabilityFilter, setTempAvailabilityFilter] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadMentors();
    // Initialize temp filters with current filter values
    setTempCampusFilter(campusFilter);
    setTempHouseFilter(houseFilter);
    setTempAvailabilityFilter(availabilityFilter);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, campusFilter, houseFilter, availabilityFilter, mentors]);

  useEffect(() => {
    paginateMentors();
  }, [filteredMentors, currentPage]);  const loadMentors = async () => {
    try {
      setLoading(true);
      const allMentors = await MentorshipService.getAllMentorsWithCapacity();
      // Filter out the current student (can't be their own mentor)
      const filteredMentors = allMentors.filter(m => m.mentor.id !== currentStudentId);
      // Sort by name alphabetically
      const sorted = filteredMentors.sort((a, b) => 
        a.mentor.name.localeCompare(b.mentor.name)
      );
      setMentors(sorted);
    } catch (err) {
      console.error('Error loading mentors:', err);
      setError('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Don't apply filters if mentors data hasn't loaded yet
    if (mentors.length === 0) return;

    let filtered = [...mentors];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.mentor.name.toLowerCase().includes(search) ||
        m.mentor.email.toLowerCase().includes(search)
      );
    }

    // Campus filter
    if (campusFilter !== 'all') {
      filtered = filtered.filter(m => m.mentor.campus === campusFilter);
    }

    // House filter
    if (houseFilter !== 'all') {
      filtered = filtered.filter(m => m.mentor.house === houseFilter);
    }

    // Availability filter (based on leave dates)
    if (availabilityFilter === 'available') {
      const today = new Date();
      filtered = filtered.filter(m => {
        // If no leave dates set, they're available
        if (!m.mentor.leave_from || !m.mentor.leave_to) return true;
        
        const leaveFrom = new Date(m.mentor.leave_from);
        const leaveTo = new Date(m.mentor.leave_to);
        
        // Available if current date is not within leave period
        return today < leaveFrom || today > leaveTo;
      });
    } else if (availabilityFilter === 'on-leave') {
      const today = new Date();
      filtered = filtered.filter(m => {
        if (!m.mentor.leave_from || !m.mentor.leave_to) return false;
        
        const leaveFrom = new Date(m.mentor.leave_from);
        const leaveTo = new Date(m.mentor.leave_to);
        
        // On leave if current date is within leave period
        return today >= leaveFrom && today <= leaveTo;
      });
    }

    setFilteredMentors(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  };
  
  const paginateMentors = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredMentors.slice(startIndex, endIndex);
    setPaginatedMentors(paginated);
    setTotalPages(Math.ceil(filteredMentors.length / itemsPerPage));
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of mentor list
    document.getElementById('mentor-list')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-md border text-sm font-medium ${
              page === currentPage
                ? 'border-primary-500 bg-primary-50 text-primary-600'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // Filter management functions for mobile UX
  const handleApplyFilters = () => {
    setCampusFilter(tempCampusFilter);
    setHouseFilter(tempHouseFilter);
    setAvailabilityFilter(tempAvailabilityFilter);
    setCurrentPage(1); // Reset to first page when filters change
    setShowFilters(false); // Close filter panel on mobile
  };

  const handleClearFilters = () => {
    const defaultCampus = userData?.campus || 'all';
    const defaultHouse = userData?.house || 'all';
    setTempCampusFilter(defaultCampus);
    setTempHouseFilter(defaultHouse);
    setTempAvailabilityFilter('all');
    setCampusFilter(defaultCampus);
    setHouseFilter(defaultHouse);
    setAvailabilityFilter('all');
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleRequestMentor = async () => {
    if (!selectedMentor) {
      setError('Please select a mentor');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the mentor change request');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await MentorshipService.requestMentorChange(
        currentStudentId,
        selectedMentor,
        currentMentorId,
        reason
      );

      setSuccess('Mentor change request submitted successfully! Waiting for admin approval.');
      
      // Wait a bit to show success message, then notify parent
      setTimeout(() => {
        onRequestSubmitted();
      }, 2000);
      
    } catch (err) {
      console.error('Error requesting mentor:', err);
      setError('Failed to submit mentor change request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Browse Mentors</h2>
            <p className="text-gray-600 mt-1">Select a mentor to request assignment</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mx-6 mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="px-6 pt-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </span>
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              {/* Filter Header with Close Button (Mobile) */}
              <div className="md:hidden flex justify-between items-center p-4 pb-2 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Filter Mentors</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {/* Campus Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus
                  </label>
                  <select
                    value={tempCampusFilter}
                    onChange={(e) => setTempCampusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Campuses</option>
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

                {/* House Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House
                  </label>
                  <select
                    value={tempHouseFilter}
                    onChange={(e) => setTempHouseFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Houses</option>
                    <option value="Bageshree">Bageshree</option>
                    <option value="Malhar">Malhar</option>
                    <option value="Bhairav">Bhairav</option>
                  </select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={tempAvailabilityFilter}
                    onChange={(e) => setTempAvailabilityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Mentors</option>
                    <option value="available">Available (Not on Leave)</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
              </div>
              
              {/* Filter Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 p-4 pt-2 bg-gray-100 border-t border-gray-200">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || campusFilter || houseFilter || availabilityFilter !== 'all'
                  ? 'No mentors match your filters'
                  : 'No mentors available'}
              </p>
            </div>
          ) : (
            <div id="mentor-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedMentors.map((mentorInfo) => {
                const isCurrentMentor = mentorInfo.mentor.id === currentMentorId;
                const hasSlots = mentorInfo.available_slots > 0;
                const isSelected = selectedMentor === mentorInfo.mentor.id;
                
                // Check if mentor is on leave
                const isOnLeave = mentorInfo.mentor.leave_from && mentorInfo.mentor.leave_to && 
                  new Date(mentorInfo.mentor.leave_from) <= new Date() && 
                  new Date(mentorInfo.mentor.leave_to) >= new Date();

                return (
                  <div
                    key={mentorInfo.mentor.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : isCurrentMentor
                        ? 'border-blue-300 bg-blue-50'
                        : hasSlots && !isOnLeave
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => {
                      if (hasSlots && !isCurrentMentor && !isOnLeave) {
                        setSelectedMentor(mentorInfo.mentor.id);
                      }
                    }}
                  >
                    <div className="space-y-3">
                      {/* Name and Badges */}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                            {mentorInfo.mentor.name}
                          </h3>
                          {isSelected && (
                            <UserCheck className="h-4 w-4 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {mentorInfo.mentor.isSuperMentor && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                              Super Mentor
                            </span>
                          )}
                          {isCurrentMentor && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              Current
                            </span>
                          )}
                          {isOnLeave && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                              On Leave
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Campus, House, Phase */}
                      <div className="space-y-1.5 text-xs text-gray-600">
                        {mentorInfo.mentor.campus && (
                          <div className="flex items-center space-x-1.5">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            <span>{mentorInfo.mentor.campus}</span>
                          </div>
                        )}
                        {mentorInfo.mentor.house && (
                          <div className="flex items-center space-x-1.5">
                            <Home className="h-3.5 w-3.5 text-gray-400" />
                            <span>{mentorInfo.mentor.house} House</span>
                          </div>
                        )}
                        {mentorInfo.mentor.current_phase_name && (
                          <div className="flex items-center space-x-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                            <span>{mentorInfo.mentor.current_phase_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Capacity */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-1.5">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {mentorInfo.current_mentees}/{mentorInfo.mentor.isSuperMentor ? '∞' : mentorInfo.max_mentees}
                          </span>
                        </div>
                        
                        {hasSlots && !isOnLeave ? (
                          <span className="text-xs text-green-700 font-medium">
                            {mentorInfo.mentor.isSuperMentor 
                              ? 'Available' 
                              : `${mentorInfo.available_slots} slot${mentorInfo.available_slots > 1 ? 's' : ''}`
                            }
                          </span>
                        ) : isOnLeave ? (
                          <span className="text-xs text-orange-700 font-medium">
                            Unavailable
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-medium">
                            Full
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {filteredMentors.length > itemsPerPage && (
            <div className="mt-6 flex justify-center">
              {renderPagination()}
            </div>
          )}
        </div>

        {/* Footer with reason and submit */}
        {!success && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for change <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you want to change your mentor... (required)"
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedMentor 
                  ? 'Your request will be sent to admin for approval'
                  : 'Select a mentor with available slots to continue'}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestMentor}
                  disabled={!selectedMentor || submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorBrowser;
