import React, { useState, useEffect } from 'react';
import { AdminService, PhaseService, MentorshipService } from '../../services/dataServices';
import { 
  Users, 
  UserCheck, 
  ArrowRight, 
  Search,
  AlertCircle,
  CheckCircle,
  Award,
  TrendingUp,
  Bell,
  X,
  Clock
} from 'lucide-react';
import MentorRequestApproval from './MentorRequestApproval';

interface StudentWithMentor {
  id: string;
  name: string;
  email: string;
  mentor_id?: string;
  currentPhaseName?: string;
  currentPhaseOrder?: number;
  house?: string;
}

interface SuggestedMentor {
  id: string;
  name: string;
  email: string;
  currentPhaseName: string;
  currentPhaseOrder: number;
  currentPhaseId: string | null;
  house?: string;
}

const MentorAssignment: React.FC = () => {
  const [students, setStudents] = useState<StudentWithMentor[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithMentor | null>(null);
  const [suggestedMentors, setSuggestedMentors] = useState<SuggestedMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mentorSearchTerm, setMentorSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_mentor' | 'without_mentor'>('all');
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  const houses = ['Bageshree', 'Malhar', 'Bhairav'];

  useEffect(() => {
    loadStudents();
    loadPendingRequestsCount();
  }, []);

  const loadPendingRequestsCount = async () => {
    try {
      // Get actual pending requests count
      const pendingRequests = await MentorshipService.getPendingMentorRequests();
      setPendingRequestsCount(pendingRequests.length);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      // If there's an error, set to 0
      setPendingRequestsCount(0);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const allUsers = await AdminService.getAllUsers();
      const phases = await PhaseService.getAllPhases();
      
      // Get students (non-admin users) with their current phase
      const studentsData = await Promise.all(
        allUsers
          .filter(u => !u.isAdmin)
          .map(async (user) => {
            const phaseId = await AdminService.getStudentCurrentPhase(user.id);
            const phase = phaseId ? phases.find(p => p.id === phaseId) : null;
            
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              mentor_id: user.mentor_id,
              currentPhaseName: phase?.name || 'Not Started',
              currentPhaseOrder: phase?.order || 0
            };
          })
      );

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student: StudentWithMentor) => {
    setSelectedStudent(student);
    setLoadingMentors(true);
    
    try {
      const suggested = await AdminService.getSuggestedMentors(student.id);
      setSuggestedMentors(suggested);
    } catch (error) {
      console.error('Error loading suggested mentors:', error);
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleAssignMentor = async (mentorId: string) => {
    if (!selectedStudent) return;

    try {
      setAssigning(true);
      await AdminService.assignMentor(selectedStudent.id, mentorId);
      
      // Update local state
      setStudents(students.map(s => 
        s.id === selectedStudent.id ? { ...s, mentor_id: mentorId } : s
      ));
      
      setSelectedStudent({ ...selectedStudent, mentor_id: mentorId });
      
      alert('Mentor assigned successfully!');
    } catch (error) {
      console.error('Error assigning mentor:', error);
      alert('Failed to assign mentor');
    } finally {
      setAssigning(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const q = searchTerm.toLowerCase();
    const name = (student.name || '').toLowerCase();
    const email = (student.email || '').toLowerCase();
    const matchesSearch = searchTerm === '' || name.includes(q) || email.includes(q);

    let matchesType = true;
    if (filterType === 'with_mentor') matchesType = !!student.mentor_id;
    if (filterType === 'without_mentor') matchesType = !student.mentor_id;

    return matchesSearch && matchesType;
  });

  const stats = {
    total: students.length,
    withMentor: students.filter(s => s.mentor_id).length,
    withoutMentor: students.filter(s => !s.mentor_id).length
  };

  // Precompute filtered mentors and a no-results flag to keep JSX simple
  const mentorQuery = mentorSearchTerm.toLowerCase();
  const filteredMentors = suggestedMentors.filter(mentor => {
    const name = (mentor.name || '').toLowerCase();
    const email = (mentor.email || '').toLowerCase();
    const phaseName = (mentor.currentPhaseName || '').toLowerCase();
    const matches = mentorSearchTerm === '' ? true : (
      name.includes(mentorQuery) || email.includes(mentorQuery) || phaseName.includes(mentorQuery)
    );
    return matches && (!selectedHouse || mentor.house === selectedHouse);
  });
  const noMentors = filteredMentors.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Mentor</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withMentor}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Mentor</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withoutMentor}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        {/* Mentor Requests Card */}
        <div 
          className="bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowRequestsModal(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mentor Requests</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequestsCount}</p>
            </div>
            <div className="relative">
              <Bell className="h-8 w-8 text-purple-500" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Mentor Change Requests</h2>
              <button
                onClick={() => setShowRequestsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <MentorRequestApproval />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
            
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('without_mentor')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'without_mentor'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  No Mentor
                </button>
                <button
                  onClick={() => setFilterType('with_mentor')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'with_mentor'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Has Mentor
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No students found
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{student.name}</h4>
                        {!student.mentor_id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            No Mentor
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{student.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{student.currentPhaseName}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggested Mentors */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedStudent ? `Suggested Mentors for ${selectedStudent.name}` : 'Select a student to see suggested mentors'}
            </h3>
            {selectedStudent && (
              <>
                <p className="text-sm text-gray-600 mt-1">
                  Student is currently in: <span className="font-medium">{selectedStudent.currentPhaseName}</span>
                </p>
                <div className="space-y-3 mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search mentors..."
                      value={mentorSearchTerm}
                      onChange={(e) => setMentorSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedHouse(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedHouse === null
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      All Houses
                    </button>
                    {houses.map(house => (
                      <button
                        key={house}
                        onClick={() => setSelectedHouse(house)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedHouse === house
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {house}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {!selectedStudent ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Select a student from the list to see mentor suggestions</p>
              </div>
            ) : loadingMentors ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : noMentors ? (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>
                  {mentorSearchTerm 
                    ? 'No mentors found matching your search'
                    : 'No mentors available for this student'
                  }
                </p>
              </div>
            ) : (
              filteredMentors.map((mentor) => (
                <div key={mentor.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{mentor.name}</h4>
                        {mentor.currentPhaseOrder > (selectedStudent.currentPhaseOrder || 0) && (
                          <span title="Advanced student">
                            <Award className="h-4 w-4 text-yellow-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{mentor.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          {mentor.currentPhaseName}
                        </span>
                        {mentor.currentPhaseOrder > (selectedStudent.currentPhaseOrder || 0) && (
                          <span className="text-xs text-gray-500">
                            ({mentor.currentPhaseOrder - (selectedStudent.currentPhaseOrder || 0)} phase{mentor.currentPhaseOrder - (selectedStudent.currentPhaseOrder || 0) > 1 ? 's' : ''} ahead)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignMentor(mentor.id)}
                      disabled={assigning || selectedStudent.mentor_id === mentor.id}
                      className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                        selectedStudent.mentor_id === mentor.id
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {assigning ? (
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                      ) : selectedStudent.mentor_id === mentor.id ? (
                        <span className="flex items-center">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Assigned
                        </span>
                      ) : (
                        'Assign'
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Mentor Assignment Logic:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Mentors are suggested based on their current learning phase</li>
              <li>Students in the same or higher phases are shown as potential mentors</li>
              <li>More advanced students (higher phases) are listed first</li>
              <li>Students with <Award className="h-3 w-3 inline text-yellow-500" /> are ahead in their learning journey</li>
              <li>Mentors will review goals and provide feedback to their assigned students</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorAssignment;
