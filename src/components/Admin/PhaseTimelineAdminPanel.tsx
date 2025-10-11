import React, { useState, useEffect } from 'react';
import { initialPhases } from '../../data/initialData';

interface PhaseTimelineRow {
  name: string;
  expectedDays: number | null;
  isStandalone: boolean;
}

const PhaseTimelineAdminPanel: React.FC = () => {
  const [rows, setRows] = useState<PhaseTimelineRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllPhases = async () => {
      try {
        setLoading(true);
        
        // Combine all phases from different sources
        const allPhases = [
          ...initialPhases,
          // Add phases 3-7 that were defined in separate files
          { name: 'Phase 3: Interactive Quiz Master', order: 4 },
          { name: 'Phase 4: AI-Powered Content Generator', order: 5 },
          { name: 'Phase 5: Ask Gemini Web App', order: 6 },
          { name: 'Phase 6: Student Feedback Manager', order: 7 },
          { name: 'Phase 7: CollabSphere', order: 8 },
        ];

        // Sort by order and create editable rows
        const sortedPhases = allPhases.sort((a, b) => {
          // Handle special order values
          if (a.order === -1 && b.order === -1) return 0;
          if (a.order === -1) return 1; // -1 goes to end
          if (b.order === -1) return -1;
          return a.order - b.order;
        });

        const phaseRows = sortedPhases.map(phase => ({
          name: phase.name,
          expectedDays: null, // default value, admin sets this
          isStandalone: false // default value, admin sets this
        }));

        setRows(phaseRows);
      } catch (error) {
        console.error('Error loading phases:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllPhases();
  }, []);

  const handleDaysChange = (idx: number, value: string) => {
    const days = value === '' ? null : Math.max(0, parseInt(value));
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, expectedDays: days } : row));
  };

  const handleStandaloneChange = (idx: number, checked: boolean) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, isStandalone: checked, expectedDays: checked ? null : row.expectedDays } : row));
  };

  // Placeholder for save logic
  const handleSave = () => {
    // TODO: Save to Firestore or backend
    alert('Phase timeline saved!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading phases...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Phase Timeline Management</h2>
      <p className="text-gray-600 mb-4">Set expected completion days for each learning phase.</p>
      <table className="w-full border rounded-lg mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 text-left">Phase Name</th>
            <th className="py-2 px-4 text-left">Expected Days</th>
            <th className="py-2 px-4 text-left">Standalone</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.name} className="border-t">
              <td className="py-2 px-4">{row.name}</td>
              <td className="py-2 px-4">
                <input
                  type="number"
                  min="0"
                  value={row.expectedDays ?? ''}
                  disabled={row.isStandalone}
                  onChange={e => handleDaysChange(idx, e.target.value)}
                  className="border rounded px-2 py-1 w-24"
                />
              </td>
              <td className="py-2 px-4">
                <input
                  type="checkbox"
                  checked={row.isStandalone}
                  onChange={e => handleStandaloneChange(idx, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleSave}
        className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700"
      >
        Save
      </button>
    </div>
  );
};

export default PhaseTimelineAdminPanel;
