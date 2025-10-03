import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const ReflectionSubmission: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to goal setting page where new reflection form is integrated
    navigate('/goal-setting');
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Redirecting...
            </h3>
            <p className="text-sm text-yellow-700">
              Reflection submission is now integrated with the Goal Setting page. 
              You'll be redirected automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectionSubmission;
