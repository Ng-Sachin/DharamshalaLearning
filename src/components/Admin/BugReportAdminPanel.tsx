import React, { useState } from 'react';

// Dummy data for demonstration; replace with real data source
const initialReports = [
  {
    id: 1,
    description: 'App crashes on login',
    consoleLogs: 'Error: Uncaught TypeError...',
    reviewed: false,
    submittedAt: '2025-10-05',
    user: 'Student A',
  },
  {
    id: 2,
    description: 'Feature request: Add dark mode',
    consoleLogs: '',
    reviewed: false,
    submittedAt: '2025-10-04',
    user: 'Mentor B',
  },
];

const BugReportAdminPanel: React.FC = () => {
  const [reports, setReports] = useState(initialReports);

  const handleReviewed = (id: number) => {
    setReports(reports.map(r => r.id === id ? { ...r, reviewed: true } : r));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Bug/Feature Reports</h2>
        <p className="text-sm text-gray-600 mt-2 sm:mt-0">
          {reports.length} total report{reports.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {reports.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
          <p className="text-gray-600">User feedback and bug reports will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Console Logs</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Submitted At</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map(report => (
              <tr key={report.id} className={report.reviewed ? 'bg-green-50' : 'hover:bg-gray-50'}>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.user}</td>
                <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate">{report.description}</td>
                <td className="px-3 py-4 text-sm text-gray-500 hidden sm:table-cell max-w-xs truncate">{report.consoleLogs || '-'}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{report.submittedAt}</td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${report.reviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {report.reviewed ? 'Reviewed' : 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  {!report.reviewed && (
                    <button
                      onClick={() => handleReviewed(report.id)}
                      className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-xs font-medium transition-colors"
                    >
                      Mark Reviewed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default BugReportAdminPanel;
