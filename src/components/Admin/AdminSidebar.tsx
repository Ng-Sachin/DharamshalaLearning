import React from 'react';

interface SidebarSection {
  label: string;
  tabs: { id: string; label: string; icon: React.ElementType }[];
}

const sections: SidebarSection[] = [
  {
    label: 'System',
    tabs: [
      { id: 'overview', label: 'Overview', icon: require('lucide-react').Database },
      { id: 'phase-timeline', label: 'Phase Timeline', icon: require('lucide-react').Settings },
    ],
  },
  {
    label: 'Users',
    tabs: [
      { id: 'users', label: 'User Management', icon: require('lucide-react').Users },
      { id: 'mentors', label: 'Mentor Assignment', icon: require('lucide-react').UserCheck },
      { id: 'super-mentors', label: 'Super Mentors', icon: require('lucide-react').Star },
      { id: 'mentor-requests', label: 'Mentor Requests', icon: require('lucide-react').UserPlus },
    ],
  },
  {
    label: 'Curriculum',
    tabs: [
      { id: 'curriculum', label: 'Curriculum', icon: require('lucide-react').Database },
      { id: 'journey-tracking', label: 'Journey Tracking', icon: require('lucide-react').BarChart3 },
    ],
  },
  {
    label: 'Reports & Feedback',
    tabs: [
      { id: 'reports', label: 'Reports', icon: require('lucide-react').BarChart3 },
      { id: 'bug-reports', label: 'Bug Reports', icon: require('lucide-react').MessageSquare },
    ],
  },
];

const AdminSidebar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => (
  <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
    <div className="p-6 border-b">
      <h2 className="text-xl font-bold text-primary-600">Admin Panel</h2>
    </div>
    <nav className="flex-1 overflow-y-auto">
      {sections.map(section => (
        <div key={section.label} className="mb-6">
          <h3 className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{section.label}</h3>
          {section.tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors rounded-r-lg mb-1 ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  </aside>
);

export default AdminSidebar;
