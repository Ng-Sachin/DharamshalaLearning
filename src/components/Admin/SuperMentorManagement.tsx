import React, { useState, useEffect } from 'react';
import { UserService } from '../../services/firestore';
import { User } from '../../types';
import { Star, AlertCircle, CheckCircle, Search } from 'lucide-react';

const SuperMentorManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMentorsOnly, setShowMentorsOnly] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Use getAll from the base FirestoreService class
      const allUsers = await UserService['getAll']<User>('users');
      // Show all users (mentors and non-mentors)
      setUsers(allUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuperMentor = async (userId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');
      
      await UserService.updateUser(userId, {
        isSuperMentor: !currentStatus,
        isMentor: !currentStatus, // Also set as mentor when becoming super mentor
        // Reset max_mentees when toggling super mentor status
        max_mentees: !currentStatus ? undefined : 2
      });

      setSuccess(`Super mentor status ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      await loadUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating super mentor status:', err);
      setError('Failed to update super mentor status');
    }
  };

  const updateMaxMentees = async (userId: string, maxMentees: number) => {
    try {
      setError('');
      setSuccess('');
      
      await UserService.updateUser(userId, {
        max_mentees: maxMentees || undefined
      });

      setSuccess('Mentee limit updated successfully');
      await loadUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating max mentees:', err);
      setError('Failed to update mentee limit');
    }
  };

  const filteredUsers = users.filter(user => {
    const name = (user.name || '').toString().toLowerCase();
    const email = (user.email || '').toString().toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  }).filter(user => !showMentorsOnly || user.isMentor);

  const superMentors = filteredUsers.filter(user => user.isSuperMentor);
  const regularMentors = filteredUsers.filter(user => !user.isSuperMentor);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Super Mentor Management</h2>
        <p className="text-gray-600">Manage mentors who can have unlimited mentees</p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="mentorsOnly"
            checked={showMentorsOnly}
            onChange={(e) => setShowMentorsOnly(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="mentorsOnly" className="text-sm text-gray-700">
            Show mentors only
          </label>
        </div>
      </div>

      {/* Super Mentors Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Super Mentors ({superMentors.length})
          </h3>
        </div>
        
        {superMentors.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No super mentors assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {superMentors.map(user => (
              <div key={user.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <p className="font-medium text-gray-900">{user.name}</p>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <label className="block text-xs text-gray-600 mb-1">Max Mentees</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Unlimited"
                        value={user.max_mentees || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 0) {
                            updateMaxMentees(user.id, value);
                          }
                        }}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <button
                      onClick={() => toggleSuperMentor(user.id, true)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Remove Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regular Mentors Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          All Users ({regularMentors.length})
        </h3>
        
        {regularMentors.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {regularMentors.map(user => (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      {user.isMentor && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          Mentor
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Mentee limit: {user.max_mentees || 2}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <label className="block text-xs text-gray-600 mb-1">Max Mentees</label>
                      <input
                        type="number"
                        min="0"
                        value={user.max_mentees || 2}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 0) {
                            updateMaxMentees(user.id, value);
                          }
                        }}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <button
                      onClick={() => toggleSuperMentor(user.id, false)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center space-x-2"
                    >
                      <Star className="h-4 w-4" />
                      <span>Make Super Mentor</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Super Mentors:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Super mentors can have unlimited mentees by default</li>
              <li>You can override the max mentees limit for any mentor</li>
              <li>Regular mentors have a default limit of 2 mentees</li>
              <li>Setting a specific number overrides the default limits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperMentorManagement;
