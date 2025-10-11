import React, { useState, useEffect } from 'react';
import { initialPhases, detailedTopics } from '../../data/initialData';

interface EditablePhase {
  name: string;
  order: number;
  isSenior?: boolean;
  topics: EditableTopic[];
  isEdited?: boolean;
}

interface EditableTopic {
  name: string;
  order: number;
  deliverable: string;
  description?: string;
  isEdited?: boolean;
}

const CurriculumAdminPanel: React.FC = () => {
  // Convert initial data to editable format
  const [phases, setPhases] = useState<EditablePhase[]>([]);
  const [csvData, setCsvData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load phases directly from local data - no async needed
    try {
      console.log('Loading curriculum admin panel...');
      setLoading(true);
      setError(null);
      
      const loadedPhases: EditablePhase[] = initialPhases.map(phase => ({
        name: phase.name,
        order: phase.order,
        isSenior: phase.isSenior || false,
        topics: (detailedTopics[phase.name] || []).map(topic => ({
          name: topic.name,
          order: topic.order,
          deliverable: topic.deliverable,
          description: topic.description || '',
          isEdited: false
        })),
        isEdited: false
      }));
      
      loadedPhases.sort((a, b) => {
        if ((a.isSenior ? 1 : 0) !== (b.isSenior ? 1 : 0)) return (a.isSenior ? 1 : 0) - (b.isSenior ? 1 : 0);
        return a.order - b.order;
      });
      
      console.log('Loaded phases:', loadedPhases.length);
      setPhases(loadedPhases);
      setLoading(false);
      console.log('Curriculum admin panel loaded successfully');
      
    } catch (err) {
      console.error('Error loading phases:', err);
      setError('Failed to load curriculum phases. See console for details.');
      setLoading(false);
    }
  }, []);

  // Add new phase
  const addPhase = () => {
    setPhases([
      ...phases,
      {
        name: '',
        order: phases.length + 1,
        isSenior: false,
        topics: [],
        isEdited: true
      }
    ]);
  };

  // Add new topic to a phase
  const addTopic = (phaseIdx: number) => {
    const updated = [...phases];
    updated[phaseIdx].topics.push({
      name: '',
      order: updated[phaseIdx].topics.length + 1,
      deliverable: '',
      description: '',
      isEdited: true
    });
    updated[phaseIdx].isEdited = true;
    setPhases(updated);
  };

  // Edit phase/topic
  const handlePhaseChange = (idx: number, field: keyof EditablePhase, value: any) => {
    const updated = [...phases];
    // Type-safe assignment for EditablePhase fields
    if (field === 'name' && typeof value === 'string') {
      updated[idx].name = value;
    } else if (field === 'order' && typeof value === 'number') {
      updated[idx].order = value;
    // Removed start_date and end_date handling
    } else if (field === 'topics' && Array.isArray(value)) {
      updated[idx].topics = value;
    }
    updated[idx].isEdited = true;
    setPhases(updated);
  };
  const handleTopicChange = (phaseIdx: number, topicIdx: number, field: keyof EditableTopic, value: any) => {
    const updated = [...phases];
    const topic = updated[phaseIdx].topics[topicIdx];
    if (!topic) return;

    if (field === 'name' && typeof value === 'string') {
      topic.name = value;
    } else if (field === 'order' && typeof value === 'number') {
      topic.order = value;
    } else if (field === 'deliverable' && typeof value === 'string') {
      topic.deliverable = value;
    } else if (field === 'description' && typeof value === 'string') {
      topic.description = value;
    }

    topic.isEdited = true;
    updated[phaseIdx].isEdited = true;
    setPhases(updated);
  };

  // Export to CSV
  const exportToCSV = () => {
    let csv = 'Phase,Phase Order,IsSenior,Topic,Topic Order,Deliverable,Description\n';
    phases.forEach(phase => {
      phase.topics.forEach(topic => {
        csv += `${phase.name},${phase.order},${phase.isSenior ? 'true' : 'false'},${topic.name},${topic.order},${topic.deliverable},${topic.description}\n`;
      });
    });
    setCsvData(csv);
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'curriculum.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Upload CSV (merge logic)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // skip header
      const newPhases: EditablePhase[] = [...phases];
      lines.forEach(line => {
        if (!line.trim()) return;
        const cols = line.split(',');
        // Expect: Phase,Phase Order,IsSenior,Topic,Topic Order,Deliverable,Description
        let phaseName = cols[0] || '';
        let phaseOrder = cols[1] ? Number(cols[1]) : (newPhases.length + 1);
        let isSenior = false;
        let topicName = '';
        let topicOrder = 0;
        let deliverable = '';
        let description = '';
        if (cols.length >= 7) {
          isSenior = (cols[2] || '').toLowerCase() === 'true';
          topicName = cols[3] || '';
          topicOrder = cols[4] ? Number(cols[4]) : 1;
          deliverable = cols[5] || '';
          description = cols[6] || '';
        } else {
          // fallback for older CSVs: Phase,Phase Order,Topic,Topic Order,Deliverable,Description
          phaseName = cols[0] || '';
          phaseOrder = cols[1] ? Number(cols[1]) : (newPhases.length + 1);
          topicName = cols[2] || '';
          topicOrder = cols[3] ? Number(cols[3]) : 1;
          deliverable = cols[4] || '';
          description = cols[5] || '';
        }
        let phase = newPhases.find(p => p.name === phaseName);
        if (!phase) {
          // Add new phase
          phase = {
            name: phaseName,
            order: Number(phaseOrder),
            topics: [],
            isEdited: false,
            isSenior: isSenior
          };
          newPhases.push(phase);
        }
        let topic = phase.topics.find(t => t.name === topicName);
        if (!topic) {
          // Add new topic
          phase.topics.push({
            name: topicName,
            order: Number(topicOrder),
            deliverable,
            description,
            isEdited: false
          });
        }
        // If topic exists and isEdited, do not overwrite
      });
      // After merging, sort so senior phases appear last and order within groups
      newPhases.sort((a, b) => {
        if ((a.isSenior ? 1 : 0) !== (b.isSenior ? 1 : 0)) return (a.isSenior ? 1 : 0) - (b.isSenior ? 1 : 0);
        return a.order - b.order;
      });
      setPhases(newPhases);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Curriculum Admin Panel</h2>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <span className="text-gray-600">Loading curriculum phases...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <>
          <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={addPhase}>Add Phase</button>
          <button className="mb-4 ml-2 px-4 py-2 bg-green-600 text-white rounded" onClick={exportToCSV}>Export to CSV</button>
          <input type="file" accept=".csv" className="mb-4 ml-2" onChange={handleCSVUpload} />
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Phase</th>
                  <th className="border px-2 py-1">Order</th>
                  {/* Removed Start Date and End Date columns */}
                  <th className="border px-2 py-1">Topics</th>
                  <th className="border px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((phase, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">
                      <input value={phase.name} onChange={e => handlePhaseChange(idx, 'name', e.target.value)} className="w-32 border rounded px-1" />
                    </td>
                    <td className="border px-2 py-1">
                      <input type="number" value={phase.order} onChange={e => handlePhaseChange(idx, 'order', Number(e.target.value))} className="w-16 border rounded px-1" />
                    </td>
                    {/* Removed Start Date and End Date inputs */}
                    <td className="border px-2 py-1">
                      <table className="border">
                        <thead>
                          <tr>
                            <th className="border px-1">Topic</th>
                            <th className="border px-1">Order</th>
                            <th className="border px-1">Deliverable</th>
                            <th className="border px-1">Description</th>
                            <th className="border px-1">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phase.topics.map((topic, tIdx) => (
                            <tr key={tIdx}>
                              <td className="border px-1">
                                <input value={topic.name} onChange={e => handleTopicChange(idx, tIdx, 'name', e.target.value)} className="w-24 border rounded px-1" />
                              </td>
                              <td className="border px-1">
                                <input type="number" value={topic.order} onChange={e => handleTopicChange(idx, tIdx, 'order', Number(e.target.value))} className="w-12 border rounded px-1" />
                              </td>
                              <td className="border px-1">
                                <input value={topic.deliverable} onChange={e => handleTopicChange(idx, tIdx, 'deliverable', e.target.value)} className="w-24 border rounded px-1" />
                              </td>
                              <td className="border px-1">
                                <input value={topic.description} onChange={e => handleTopicChange(idx, tIdx, 'description', e.target.value)} className="w-32 border rounded px-1" />
                              </td>
                              <td className="border px-1">
                                {/* Future: Add delete/edit buttons */}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={5} className="border px-1 text-center">
                              <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => addTopic(idx)}>Add Topic</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="border px-2 py-1">
                      {/* Future: Add delete/edit buttons for phase */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {csvData && (
            <div className="mt-4">
              <h3 className="font-bold">CSV Preview:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">{csvData}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CurriculumAdminPanel;
