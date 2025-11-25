import React, { useState } from 'react';
import { User, Building, Home, Code, CheckCircle, MessageSquare } from 'lucide-react';
import Toast from './Toast';
import { User as UserType } from '../../types';
import { UserService } from '../../services/firestore';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onProfileUpdated: (updatedUser: UserType) => void;
}

interface ProfileFormData {
  name: string;
  campus: UserType['campus'] | '';
  house: UserType['house'] | '';
  skills: string[];
  gemini_api_key?: string;
  discord_user_id?: string;
}

const CAMPUS_OPTIONS: UserType['campus'][] = [
  'Dantewada',
  'Dharamshala', 
  'Eternal',
  'Jashpur',
  'Kishanganj',
  'Pune',
  'Raigarh',
  'Sarjapura'
];

const HOUSE_OPTIONS: UserType['house'][] = [
  'Bageshree',
  'Malhar',
  'Bhairav'
];

const COMMON_SKILLS = [
  'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Python',
  'Java', 'C++', 'SQL', 'MongoDB', 'Express.js', 'TypeScript',
  'Git', 'Problem Solving', 'Communication', 'Teamwork'
];

export default function ProfileCompletionModal({ 
  isOpen, 
  onClose, 
  user, 
  onProfileUpdated 
}: ProfileCompletionModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name || '',
    campus: user.campus || '',
    house: user.house || '',
    skills: user.skills || [],
    gemini_api_key: user.gemini_api_key || '',
    discord_user_id: user.discord_user_id || ''
  });

  const [skillInput, setSkillInput] = useState('');

  // Calculate missing fields and total steps (skills are optional)
  const missingFields: string[] = [];
  if (!user.name?.trim()) missingFields.push('name');
  if (!user.campus) missingFields.push('campus');
  if (!user.house) missingFields.push('house');
  
  // Add optional skills, Gemini key, and Discord ID steps if not provided
  const hasNoSkills = !user.skills || user.skills.length === 0;
  const optionalSteps = [];
  if (hasNoSkills) optionalSteps.push('skills');
  optionalSteps.push('discord_user_id'); // Discord ID (optional)
  optionalSteps.push('gemini_api_key'); // Always allow Gemini key step (optional)

  const totalSteps = Math.max(1, missingFields.length + optionalSteps.length);

  const getCurrentStepField = () => {
    if (currentStep <= missingFields.length) {
      return missingFields[currentStep - 1];
    }
    
    let optionalStep = currentStep - missingFields.length;
    if (hasNoSkills) {
      if (optionalStep === 1) return 'skills';
      optionalStep--;
    }
    if (optionalStep === 1) return 'discord_user_id';
    if (optionalStep === 2) return 'gemini_api_key';
    
    return 'complete';
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addCommonSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const updates: Partial<UserType> = {};
      // Update required fields
      if (missingFields.includes('name')) updates.name = formData.name;
      if (missingFields.includes('campus')) updates.campus = formData.campus as UserType['campus'];
      if (missingFields.includes('house')) updates.house = formData.house as UserType['house'];
      // Update skills if user has added any (optional)
      if (formData.skills.length > 0) {
        updates.skills = formData.skills;
      }
      // Update Discord ID if provided (optional)
      if (formData.discord_user_id && formData.discord_user_id.trim().length > 0) {
        updates.discord_user_id = formData.discord_user_id.trim();
      }
      // Update Gemini API key if provided (optional)
      if (formData.gemini_api_key && formData.gemini_api_key.trim().length > 0) {
        updates.gemini_api_key = formData.gemini_api_key.trim();
      }
      await UserService.updateUser(user.id, updates);
      const updatedUser = { ...user, ...updates };
      onProfileUpdated(updatedUser);
      // show a small toast and then close
      setToast({ visible: true, message: 'Profile saved', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast({ visible: true, message: 'Failed to update profile', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentStepValid = () => {
    const field = getCurrentStepField();
    switch (field) {
      case 'name': return formData.name.trim().length > 0;
      case 'campus': return formData.campus !== '';
      case 'house': return formData.house !== '';
      case 'skills': return true; // Skills are optional, always valid
      case 'discord_user_id': return true; // Discord ID is optional, always valid
      case 'gemini_api_key': return true; // Optional, always valid
      case 'complete': return true;
      default: return false;
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Complete Your Profile
        </span>
        <span className="text-sm text-gray-500">
          {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStepContent = () => {
    const field = getCurrentStepField();

    switch (field) {
      case 'name':
        return (
          <div className="text-center">
            <User className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What's your name?
            </h3>
            <p className="text-gray-600 mb-6">
              Help us personalize your experience by providing your full name.
            </p>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg"
              autoFocus
            />
          </div>
        );

      case 'campus':
        return (
          <div className="text-center">
            <Building className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Which campus are you from?
            </h3>
            <p className="text-gray-600 mb-6">
              Select your campus to connect with your local community.
            </p>
            <select
              value={formData.campus}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                campus: e.target.value as UserType['campus'] | ''
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            >
              <option value="">Select your campus</option>
              {CAMPUS_OPTIONS.map(campus => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>
          </div>
        );

      case 'house':
        return (
          <div className="text-center">
            <Home className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Which house do you belong to?
            </h3>
            <p className="text-gray-600 mb-6">
              Join your house community for team activities and events.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {HOUSE_OPTIONS.map(house => {
                const isSelected = formData.house === house;
                const getHouseColor = (houseName: string) => {
                  switch (houseName) {
                    case 'Bageshree': return 'border-blue-300 bg-blue-50 text-blue-700';
                    case 'Malhar': return 'border-green-300 bg-green-50 text-green-700';
                    case 'Bhairav': return 'border-orange-300 bg-orange-50 text-orange-700';
                    default: return 'border-gray-300 bg-gray-50 text-gray-700';
                  }
                };
                const houseColor = getHouseColor(house || '');

                return (
                  <button
                    key={house}
                    onClick={() => setFormData(prev => ({ ...prev, house }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isSelected 
                        ? houseColor
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-semibold">{house}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="text-center">
            <Code className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What are your skills? <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </h3>
            <p className="text-gray-600 mb-6">
              Add your technical and soft skills to help mentors guide you better. You can skip this step and add skills later from your profile.
            </p>
            
            {/* Add custom skill */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Add
              </button>
            </div>

            {/* Common skills */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Or select from common skills:</p>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {COMMON_SKILLS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => addCommonSkill(skill)}
                    disabled={formData.skills.includes(skill)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      formData.skills.includes(skill)
                        ? 'bg-gray-100 text-gray-400 border-gray-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected skills */}
            {formData.skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skip skills option */}
            {formData.skills.length === 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  You can skip this step and focus on learning. 
                  You can always add skills later from your profile page.
                </p>
              </div>
            )}
          </div>
        );

      case 'discord_user_id':
        return (
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Discord Username <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </h3>
            <p className="text-gray-600 mb-6">
              Add your Discord username to receive attendance notifications and daily summaries in your Discord server.
            </p>
            <input
              type="text"
              value={formData.discord_user_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, discord_user_id: e.target.value }))}
              placeholder="@username or username#1234"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg"
            />
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-800 mb-2">
                <strong>How to find your Discord username:</strong>
              </p>
              <ol className="text-sm text-indigo-800 list-decimal list-inside space-y-1">
                <li>Open Discord</li>
                <li>Click on your profile picture at bottom-left</li>
                <li>Copy your username (e.g., @username or username#1234)</li>
                <li>Paste it here</li>
              </ol>
              <p className="text-xs text-indigo-700 mt-2">
                Your Discord ID will be used to mention you in attendance notifications.
              </p>
            </div>
          </div>
        );

      case 'gemini_api_key':
        return (
          <div className="text-center">
            <User className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gemini API Key <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </h3>
            <p className="text-gray-600 mb-6">
              Add your Gemini API key to enable AI-powered SMART goal feedback. Get your free API key from Google AI Studio.
            </p>
            <input
              type="text"
              value={formData.gemini_api_key || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, gemini_api_key: e.target.value }))}
              placeholder="Paste your Gemini API key here"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg"
            />
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>How to get your Gemini API key:</strong>
              </p>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API key"</li>
                <li>Copy the generated key (starts with "AIza...")</li>
                <li>Paste it here</li>
              </ol>
              <p className="text-xs text-blue-700 mt-2">
                Note: This is different from your Firebase API key. Make sure to get it from Google AI Studio.
              </p>
            </div>
          </div>
        );
      case 'complete':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Complete!
            </h3>
            <p className="text-gray-600 mb-6">
              Great! Your profile is now complete. You can always update it later from your profile page.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Profile Updates:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {missingFields.includes('name') && (
                  <li>• Name: {formData.name}</li>
                )}
                {missingFields.includes('campus') && (
                  <li>• Campus: {formData.campus}</li>
                )}
                {missingFields.includes('house') && (
                  <li>• House: {formData.house}</li>
                )}
                {formData.skills.length > 0 && (
                  <li>• Skills: {formData.skills.join(', ')}</li>
                )}
                {formData.discord_user_id && (
                  <li>• Discord ID: {formData.discord_user_id}</li>
                )}
                {formData.gemini_api_key && (
                  <li>• Gemini API Key: <span className="text-xs text-gray-500">(Saved)</span></li>
                )}
                {missingFields.length === 0 && formData.skills.length === 0 && !formData.discord_user_id && !formData.gemini_api_key && (
                  <li className="text-gray-500 italic">No updates needed - profile is complete!</li>
                )}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  if (!isOpen || missingFields.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Complete Your Profile
          </h2>
          <button
            onClick={handleComplete}
            className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save profile'}
          </button>
        </div>

        {/* Progress */}
        {renderProgressBar()}

        {/* Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {getCurrentStepField() === 'complete' ? (
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
          ) : currentStep === totalSteps ? (
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
          ) : (
            <div className="flex gap-2">
              {getCurrentStepField() === 'skills' && (
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="px-4 py-2 text-primary-600 bg-white border border-primary-600 rounded-md hover:bg-primary-50 disabled:opacity-50"
                >
                  Skip & Complete
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type as any}
          onClose={() => setToast({ visible: false, message: '', type: 'info' })}
        />
      </div>
    </div>
  );
}