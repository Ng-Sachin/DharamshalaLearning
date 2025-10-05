import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BugFeatureModalProps {
  onClose: () => void;
}

const BugFeatureModal: React.FC<BugFeatureModalProps> = ({ onClose }) => {
  const [description, setDescription] = useState('');
  const [includeConsole, setIncludeConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Optionally collect console logs
    let logs = '';
    if (includeConsole) {
      logs = consoleLogs || 'No logs provided.';
    }
    // Here you would send the report to backend/email
    // For now, just mark as submitted
    setSubmitted(true);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-6 pr-8">Report a Bug / Feature</h2>
        {submitted ? (
          <div className="text-green-600 text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-lg font-medium">Thank you for your feedback!</p>
            <p className="text-sm text-gray-600 mt-2">We'll review your report and get back to you if needed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={4}
                placeholder="Describe the bug or feature request in detail..."
                required
              />
            </div>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={includeConsole}
                onChange={e => setIncludeConsole(e.target.checked)}
                id="includeConsole"
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <label htmlFor="includeConsole" className="text-sm font-medium text-gray-700">Include console logs (optional)</label>
                <p className="text-xs text-gray-500 mt-1">Console logs can help us debug technical issues faster</p>
              </div>
            </div>
            {includeConsole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Console Logs</label>
                <textarea
                  value={consoleLogs}
                  onChange={e => setConsoleLogs(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm resize-none"
                  rows={4}
                  placeholder="Paste relevant console logs here (press F12 → Console tab)..."
                />
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BugFeatureModal;
