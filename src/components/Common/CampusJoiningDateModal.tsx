import React, { useState } from 'react';
import { Calendar, CheckCircle, X } from 'lucide-react';
import { User as UserType } from '../../types';
import { UserService } from '../../services/firestore';

interface CampusJoiningDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onDateUpdated: (updatedUser: UserType) => void;
  // If true, require user to save a joining date before continuing (hide Skip/X)
  requireFill?: boolean;
}

export default function CampusJoiningDateModal({
  isOpen,
  onClose,
  user,
  onDateUpdated,
  requireFill = false
}: CampusJoiningDateModalProps) {
  const [joiningDate, setJoiningDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joiningDate) {
      setError('Please select your campus joining date');
      return;
    }

    const selectedDate = new Date(joiningDate);
    const today = new Date();

    // Don't allow future dates
    if (selectedDate > today) {
      setError('Joining date cannot be in the future');
      return;
    }

    // Don't allow dates too far in the past (more than 5 years ago)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);
    if (selectedDate < fiveYearsAgo) {
      setError('Please enter a valid joining date');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await UserService.updateUser(user.id, {
        campus_joining_date: selectedDate
      });

      const updatedUser = { ...user, campus_joining_date: selectedDate };
      onDateUpdated(updatedUser);
      onClose();
    } catch (error) {
      console.error('Error updating joining date:', error);
      setError('Failed to save joining date. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Welcome to Campus!</h2>
          </div>
          {/* Hide explicit close when the date is required */}
          {!requireFill && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              To help us track your learning journey accurately, please tell us when you joined the campus.
            </p>

            <div>
              <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700 mb-2">
                Campus Joining Date
              </label>
              <input
                type="date"
                id="joiningDate"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This date will be used to calculate your time spent in the program
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

            <div className="flex justify-end space-x-3">
            {/* When requireFill is true, hide the Skip button to force save */}
            {!requireFill && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Skip for Now
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Save Date</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}