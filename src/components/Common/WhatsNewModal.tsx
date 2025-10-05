import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface WhatsNewModalProps {
  onClose: () => void;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ onClose }) => {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const newFeatures = [
    {
      date: 'October 5, 2025',
      feature: 'Enhanced responsive design for mobile and tablet devices'
    },
    {
      date: 'October 5, 2025',
      feature: 'Bug/Feature reporting system with admin review panel'
    },
    {
      date: 'October 5, 2025',
      feature: 'Unified campus and house dropdown options for consistency'
    },
    {
      date: 'October 4, 2025',
      feature: 'New logo and favicon updates across the platform'
    },
    {
      date: 'October 3, 2025',
      feature: 'Improved mentor browser with better filtering options'
    },
    {
      date: 'October 2, 2025',
      feature: 'Enhanced admin dashboard with better user management'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900">What's New!</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-sm">
            Check out the latest features and improvements we've added to Campus Learning!
          </p>
          
          <div className="space-y-4">
            {newFeatures.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {item.feature}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.date}
                  </p>
                </div>
                <div className="text-blue-500">
                  <Sparkles size={16} />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Have feedback or suggestions? Use the "Report a bug/Feature" option!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;