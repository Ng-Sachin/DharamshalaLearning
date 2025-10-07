import React from 'react';

export const BoltLoaderComponent: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="text-indigo-600 font-medium text-sm">Loading...</p>
      </div>
    </div>
  );
};

// Alias for consistency
export const SpinnerLoader = BoltLoaderComponent;