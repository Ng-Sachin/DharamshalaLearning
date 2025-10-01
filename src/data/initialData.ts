import { Phase, Topic } from '../types';

// Initial phases for the campus learning program
export const initialPhases: Omit<Phase, 'id' | 'created_at'>[] = [
  {
    name: 'Foundation Phase',
    start_date: new Date('2024-10-01'),
    end_date: new Date('2024-11-30'),
    order: 1
  },
  {
    name: 'Development Phase',
    start_date: new Date('2024-12-01'),
    end_date: new Date('2025-01-31'),
    order: 2
  },
  {
    name: 'Advanced Phase',
    start_date: new Date('2025-02-01'),
    end_date: new Date('2025-03-31'),
    order: 3
  },
  {
    name: 'Specialization Phase',
    start_date: new Date('2025-04-01'),
    end_date: new Date('2025-05-31'),
    order: 4
  },
  {
    name: 'Project Phase',
    start_date: new Date('2025-06-01'),
    end_date: new Date('2025-07-31'),
    order: 5
  }
];

// Initial topics organized by phase
export const initialTopics: { [phaseName: string]: Omit<Topic, 'id' | 'created_at' | 'phase_id'>[] } = {
  'Foundation Phase': [
    { name: 'HTML Fundamentals', order: 1 },
    { name: 'CSS Basics', order: 2 },
    { name: 'JavaScript Introduction', order: 3 },
    { name: 'Git & Version Control', order: 4 },
    { name: 'Development Environment Setup', order: 5 },
    { name: 'Web Development Principles', order: 6 }
  ],
  'Development Phase': [
    { name: 'Advanced JavaScript', order: 1 },
    { name: 'DOM Manipulation', order: 2 },
    { name: 'ES6+ Features', order: 3 },
    { name: 'Async Programming', order: 4 },
    { name: 'API Integration', order: 5 },
    { name: 'Testing Fundamentals', order: 6 },
    { name: 'Package Management (npm)', order: 7 }
  ],
  'Advanced Phase': [
    { name: 'React.js Fundamentals', order: 1 },
    { name: 'Component Architecture', order: 2 },
    { name: 'State Management', order: 3 },
    { name: 'React Hooks', order: 4 },
    { name: 'React Router', order: 5 },
    { name: 'TypeScript Integration', order: 6 },
    { name: 'Performance Optimization', order: 7 }
  ],
  'Specialization Phase': [
    { name: 'Node.js & Backend Development', order: 1 },
    { name: 'Database Design & Integration', order: 2 },
    { name: 'RESTful API Development', order: 3 },
    { name: 'Authentication & Security', order: 4 },
    { name: 'Cloud Services (Firebase/AWS)', order: 5 },
    { name: 'DevOps & Deployment', order: 6 },
    { name: 'Mobile Development (React Native)', order: 7 }
  ],
  'Project Phase': [
    { name: 'Project Planning & Architecture', order: 1 },
    { name: 'Full-Stack Application Development', order: 2 },
    { name: 'Code Review & Quality Assurance', order: 3 },
    { name: 'User Experience & Design', order: 4 },
    { name: 'Project Documentation', order: 5 },
    { name: 'Deployment & Production', order: 6 },
    { name: 'Portfolio Development', order: 7 },
    { name: 'Interview Preparation', order: 8 }
  ]
};

// Goal templates for better guidance
export const goalTemplates: { [topicName: string]: string[] } = {
  'HTML Fundamentals': [
    'Complete HTML structure tutorial and build a basic webpage',
    'Learn semantic HTML elements and create an accessible page layout',
    'Master HTML forms and input validation techniques'
  ],
  'CSS Basics': [
    'Style a webpage using CSS selectors and properties',
    'Implement responsive design using Flexbox',
    'Create animations and transitions for better UX'
  ],
  'JavaScript Introduction': [
    'Write functions to solve basic programming problems',
    'Manipulate arrays and objects for data processing',
    'Build an interactive calculator or simple game'
  ],
  'React.js Fundamentals': [
    'Build a todo list application with React components',
    'Implement state management for a shopping cart feature',
    'Create reusable components with proper prop handling'
  ],
  'Node.js & Backend Development': [
    'Set up Express server with basic routing',
    'Implement CRUD operations for a REST API',
    'Integrate authentication middleware for secure endpoints'
  ],
  'Project Planning & Architecture': [
    'Design system architecture for full-stack application',
    'Create user stories and technical specifications',
    'Set up project structure with proper folder organization'
  ]
};

// Achievement level descriptions
export const achievementLevels = {
  beginner: {
    range: [0, 40],
    label: 'Getting Started',
    color: 'red',
    description: 'Learning the basics and building foundation'
  },
  developing: {
    range: [41, 70],
    label: 'Developing',
    color: 'yellow',
    description: 'Understanding concepts and applying knowledge'
  },
  proficient: {
    range: [71, 85],
    label: 'Proficient',
    color: 'blue',
    description: 'Comfortable with concepts and solving problems'
  },
  advanced: {
    range: [86, 100],
    label: 'Advanced',
    color: 'green',
    description: 'Mastering concepts and teaching others'
  }
};