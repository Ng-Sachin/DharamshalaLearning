import { Phase, Topic } from '../types';

// Extended topic information including project details
export interface TopicDetails {
  name: string;
  order: number;
  maxTime: number; // in minutes
  keyTags: string[];
  deliverable: string;
  icon: string;
  technologies?: string[];
  description?: string;
}

// Initial phases for the campus learning program
export const initialPhases: Omit<Phase, 'id' | 'created_at'>[] = [
  {
    name: 'Phase 1: Student Profile & Course Portal (HTML Only)',
    start_date: new Date('2024-10-01'),
    end_date: new Date('2024-11-30'),
    order: 1
  },
  {
    name: 'Phase 2: Styling & Responsive Design',
    start_date: new Date('2024-12-01'),
    end_date: new Date('2024-12-31'),
    order: 2
  }
];

// Detailed topic information with project specifications
export const detailedTopics: { [phaseName: string]: TopicDetails[] } = {
  'Phase 1: Student Profile & Course Portal (HTML Only)': [
    {
      name: '🏠 Home Page',
      order: 1,
      maxTime: 90,
      keyTags: ['<header>', '<nav>', '<footer>', '<main>', '<ul>', '<li>', '<a>'],
      deliverable: 'Project Video 1 (Page Walkthrough)',
      icon: '🏠',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Create the main landing page. Focus is on mastering fundamental page structure and implementing basic site navigation using the new semantic tags and the anchor tag (<a>) for linking.'
    },
    {
      name: '👤 Profile Page',
      order: 2,
      maxTime: 75,
      keyTags: ['<img> (with src, alt)', '<ol>', '<br>', '<hr>'],
      deliverable: 'Project Video 2 (Page Walkthrough)',
      icon: '👤',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Build a simple "About Me" page. Focus on embedding images, using ordered (<ol>) and unordered (<ul>) lists, and using structural tags like <hr> for visual separation.'
    },
    {
      name: '📚 Courses Page',
      order: 3,
      maxTime: 75,
      keyTags: ['Relative Paths in <a> tags'],
      deliverable: 'Project Video 3 (Page Walkthrough)',
      icon: '📚',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'List courses and their descriptions. Focus on creating a clear content hierarchy using heading tags and correctly using relative paths in <a> tags to link to other pages within the project structure.'
    },
    {
      name: '📝 Feedback Page',
      order: 4,
      maxTime: 90,
      keyTags: ['<form>', '<label>', '<input> (types: email, radio, checkbox)', '<textarea>', '<select>', '<button>'],
      deliverable: 'Project Video 4 (Page Walkthrough)',
      icon: '📝',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Construct a fully-featured input form. Focus is on the proper structure of a form, labeling inputs (<label>), and utilizing a wide range of input types for data collection.'
    },
    {
      name: '📊 Grades Table Page',
      order: 5,
      maxTime: 60,
      keyTags: ['<table>', '<caption>', '<thead>', '<tbody>', '<tfoot>', '<tr>', '<th>', '<td>'],
      deliverable: 'Project Video 5 (Page Walkthrough)',
      icon: '📊',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Display tabular data (grades). Focus is entirely on table structure: organizing data into rows and cells, defining columns with headers, and structuring the table body and footer semantically.'
    },
    {
      name: '📞 Contact Us Page',
      order: 6,
      maxTime: 45,
      keyTags: ['mailto: in <a>', 'tel: in <a>', '<address>'],
      deliverable: 'Project Video 6 (Page Walkthrough)',
      icon: '📞',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Provide contact information. Focus on creating actionable links that open an email client (mailto:) or initiate a phone call (tel:), and using the semantic <address> tag.'
    },
    {
      name: 'Conceptual Review',
      order: 7,
      maxTime: 0,
      keyTags: ['Focus on Semantics and Navigation'],
      deliverable: 'Concept Video 7 (Linking It All Together)',
      icon: '🔗',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Review and finalize consistent navigation across all six pages. Ensure all links function correctly and the overall HTML structure is clean and semantically correct.'
    }
  ],
  'Phase 2: Styling & Responsive Design': [
    {
      name: 'Global Stylesheet',
      order: 1,
      maxTime: 0,
      keyTags: ['N/A (Focus is on CSS)'],
      deliverable: 'CSS Foundation',
      icon: '🎨',
      technologies: ['CSS Fundamentals', 'Selectors', 'Box Model', 'Flexbox', 'Media Queries'],
      description: 'Establish the foundation: Resetting default browser styles, setting base typography, styling structural elements (<header>, <nav>), and using pseudo-classes for link interaction.'
    },
    {
      name: 'Page-by-Page Styling',
      order: 2,
      maxTime: 0,
      keyTags: ['N/A (Focus is on CSS)'],
      deliverable: 'CSS Content Styling',
      icon: '🖌️',
      technologies: ['CSS Fundamentals', 'Selectors', 'Box Model', 'Flexbox', 'Media Queries'],
      description: 'Apply styles to specific content: using Flexbox for course cards, structuring forms for usability, styling tables with tr:nth-child for readability, and mastering the CSS Box Model for spacing.'
    },
    {
      name: 'Making It Responsive',
      order: 3,
      maxTime: 0,
      keyTags: ['N/A (Focus is on CSS)'],
      deliverable: 'Responsive Design',
      icon: '📱',
      technologies: ['CSS Fundamentals', 'Selectors', 'Box Model', 'Flexbox', 'Media Queries'],
      description: 'Introduce the basics of Responsive Web Design (RWD). Define breakpoints using Media Queries to adjust styles (e.g., stacking navigation links) for mobile and tablet screens.'
    }
  ],
  'Phase 3: Interactive Quiz Master': [
    {
      name: 'Project Introduction: Interactive Quiz Master',
      order: 1,
      maxTime: 30,
      keyTags: ['JavaScript Overview'],
      deliverable: 'No video – intro only',
      icon: '🎯',
      technologies: ['JavaScript Fundamentals'],
      description: 'Learn how JavaScript brings websites to life. Understand the goal of making an interactive quiz application using existing HTML & CSS.'
    },
    {
      name: 'Starting the Quiz (Start Page / quiz.html)',
      order: 2,
      maxTime: 60,
      keyTags: ['Variables', 'Functions', 'DOM Manipulation', 'Events'],
      deliverable: '1 Video: Show Start Page + explain variables, functions, events, DOM Manipulation.',
      icon: '▶️',
      technologies: ['JavaScript', 'DOM API', 'Event Handling'],
      description: 'Implement "Start Quiz" button functionality to reveal the first question or navigate to quiz.html. Learn DOM basics and event handling.'
    },
    {
      name: 'Storing Quiz Questions & Answers',
      order: 3,
      maxTime: 45,
      keyTags: ['Arrays', 'Objects'],
      deliverable: '1 Video: Show array/object structure + explain data organization.',
      icon: '📋',
      technologies: ['JavaScript Arrays', 'JavaScript Objects'],
      description: 'Create an array of question objects holding text, options, and correct answers. Practice storing structured data.'
    },
    {
      name: 'Displaying Questions & Options (quiz.html)',
      order: 4,
      maxTime: 60,
      keyTags: ['Loops', 'Strings', 'Functions', 'DOM Manipulation'],
      deliverable: '1 Video: Show questions & options appearing dynamically + explanation of loops, strings, DOM usage.',
      icon: '❓',
      technologies: ['JavaScript Loops', 'String Manipulation', 'DOM API'],
      description: 'Use loops to iterate through questions and display them dynamically. Build HTML content using strings.'
    },
    {
      name: 'Handling User Answers & Navigation (quiz.html)',
      order: 5,
      maxTime: 75,
      keyTags: ['Variables', 'Operators', 'Conditional Statements', 'Functions', 'DOM', 'Events'],
      deliverable: '1 Video: Show answer handling and navigation + explanation of events, conditionals, and score tracking.',
      icon: '✅',
      technologies: ['JavaScript Conditionals', 'Event Handling', 'DOM Manipulation'],
      description: 'Detect user answers, compare with correct answers, update score, and move to the next question or results page.'
    },
    {
      name: 'Calculating & Displaying Results (results.html)',
      order: 6,
      maxTime: 45,
      keyTags: ['Variables', 'Strings', 'DOM', 'Functions', 'URL Parameters'],
      deliverable: '1 Video: Show results display + explanation of score calculation and DOM usage.',
      icon: '📊',
      technologies: ['JavaScript Variables', 'DOM API', 'URL Parameters'],
      description: 'Calculate final score and display a result message dynamically. Optionally, pass data between pages.'
    },
    {
      name: 'Restarting the Quiz (Optional, results.html or quiz.html)',
      order: 7,
      maxTime: 30,
      keyTags: ['Functions', 'Variables', 'DOM', 'Events'],
      deliverable: '1 Video: Show reset functionality + explanation of functions, events, and state reset.',
      icon: '🔄',
      technologies: ['JavaScript Functions', 'Event Handling', 'State Management'],
      description: 'Implement a "Restart Quiz" feature to reset variables and page state.'
    },
    {
      name: 'Mini Projects: Practice JS Concepts',
      order: 8,
      maxTime: 120,
      keyTags: ['Variables', 'Arrays', 'Objects', 'Functions', 'DOM', 'Events', 'Operators', 'Strings'],
      deliverable: '1 Video per mini-project: Show working demo + explain concepts applied.',
      icon: '🛠️',
      technologies: ['JavaScript Fundamentals', 'DOM API', 'Event Handling'],
      description: 'Build focused practice projects: To-Do List, Tip Calculator, Quote Generator. Solidify JS fundamentals before or alongside the main project.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 9,
      maxTime: 30,
      keyTags: ['JavaScript Review'],
      deliverable: '1 Video: Reflect on learning + demonstrate final working quiz.',
      icon: '🎉',
      technologies: ['JavaScript Fundamentals'],
      description: 'Review JavaScript fundamentals applied in the project: Variables, Data Types, Operators, Strings, Loops, Arrays, Objects, Functions, DOM, Events, Conditional Statements.'
    }
  ],
  'Phase 4: AI-Powered Content Generator': [
    {
      name: 'Project Introduction: AI-Powered Content Generator',
      order: 1,
      maxTime: 30,
      keyTags: ['ES6+ Overview', 'Gemini API'],
      deliverable: 'No video – intro only',
      icon: '🤖',
      technologies: ['JavaScript ES6+', 'Gemini API'],
      description: 'Understand the goal: use modern JS (ES6+) and Gemini API to build interactive AI-powered web features.'
    },
    {
      name: 'Ask Me Anything Feature',
      order: 2,
      maxTime: 75,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises'],
      deliverable: '1 Video: Demonstrate feature + explain ES6 concepts + Gemini API call.',
      icon: '❓',
      technologies: ['JavaScript ES6+', 'Fetch API', 'Gemini API'],
      description: 'Build a feature where users type a question and Gemini returns an answer dynamically. Learn event handling, template literals for API queries, and fetch() for asynchronous calls.'
    },
    {
      name: 'Quick Summarizer Feature',
      order: 3,
      maxTime: 60,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises', 'Destructuring'],
      deliverable: '1 Video: Show summarizer + ES6 features + API integration.',
      icon: '📝',
      technologies: ['JavaScript ES6+', 'Destructuring', 'Gemini API'],
      description: 'Users paste text and receive a concise summary via Gemini. Learn destructuring to extract data from API responses and handle asynchronous results.'
    },
    {
      name: 'Idea Spark Feature',
      order: 4,
      maxTime: 60,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises', 'Array Methods'],
      deliverable: '1 Video: Demo feature + explain applied JS/ES6 concepts and API usage.',
      icon: '💡',
      technologies: ['JavaScript ES6+', 'Array Methods', 'Gemini API'],
      description: 'Users request creative ideas (blog topics, stories) from Gemini. Apply array methods to process multiple suggestions if needed.'
    },
    {
      name: 'Definition Finder Feature',
      order: 5,
      maxTime: 45,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises'],
      deliverable: '1 Video: Demo feature + explain ES6/API usage.',
      icon: '📚',
      technologies: ['JavaScript ES6+', 'Fetch API', 'Gemini API'],
      description: 'Users input terms, and Gemini provides definitions. Practice API request construction, fetch() handling, and DOM manipulation.'
    },
    {
      name: 'Mini Projects / Warm-up Exercises',
      order: 6,
      maxTime: 120,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'Destructuring', 'fetch()', 'Promises'],
      deliverable: '1 Video per mini-project: Show working demo + explain JS concepts & API integration.',
      icon: '🛠️',
      technologies: ['JavaScript ES6+', 'Gemini API', 'DOM Manipulation'],
      description: 'AI Joke Generator, Gemini-Powered Quiz Helper, Daily Positive Affirmation Fetcher. Focused practice on ES6 features + API calls.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 7,
      maxTime: 30,
      keyTags: ['ES6+ Review', 'Gemini API Review'],
      deliverable: '1 Video: Demonstrate final AI content generator + reflect on learning outcomes.',
      icon: '🎉',
      technologies: ['JavaScript ES6+', 'Gemini API'],
      description: 'Review ES6 fundamentals (let/const, arrow functions, template literals, destructuring, spread/rest, array methods) and Gemini API integration. Reflect on building a functional, AI-powered web app.'
    }
  ],
  'Phase 5: Ask Gemini Web App': [
    {
      name: 'Project Introduction: Ask Gemini Web App',
      order: 1,
      maxTime: 30,
      keyTags: ['Full-Stack Overview', 'Node.js', 'Express'],
      deliverable: 'No video – intro only',
      icon: '🌐',
      technologies: ['Node.js', 'Express.js', 'Gemini API'],
      description: 'Understand full-stack development: frontend communicates with backend server built in Node.js & Express, which integrates with Gemini API.'
    },
    {
      name: 'Express App Setup & Structure',
      order: 2,
      maxTime: 45,
      keyTags: ['Node.js runtime', 'express()', 'Project folder structure'],
      deliverable: '1 Video: Show setup, folder structure, app.listen(), basic server code.',
      icon: '⚙️',
      technologies: ['Node.js', 'Express.js', 'npm'],
      description: 'Initialize Express server, install dependencies, organize project folders (server code, frontend files).'
    },
    {
      name: 'Backend Routes & Request Handling',
      order: 3,
      maxTime: 60,
      keyTags: ['Express routes (app.get(), app.post())', 'express.json()'],
      deliverable: '1 Video: Demonstrate routes handling user inputs.',
      icon: '🛤️',
      technologies: ['Express.js Routes', 'JSON Parsing'],
      description: 'Handle frontend requests via GET/POST. Parse incoming request data (JSON), structure server responses.'
    },
    {
      name: 'Gemini API Integration on Backend',
      order: 4,
      maxTime: 75,
      keyTags: ['fetch() / axios', 'Promises', 'async/await', 'environment variables (.env, dotenv)'],
      deliverable: '1 Video: Show API integration + explain API key security + backend response processing.',
      icon: '🔗',
      technologies: ['Gemini API', 'Environment Variables', 'Async/Await'],
      description: 'Securely communicate with Gemini API from server. Handle asynchronous responses, parse JSON, return data to frontend.'
    },
    {
      name: 'Frontend-Backend Interaction Demo',
      order: 5,
      maxTime: 60,
      keyTags: ['DOM manipulation', 'fetch() (frontend)', 'Event handling'],
      deliverable: '1 Video: Demo full app flow (frontend → backend → Gemini → frontend).',
      icon: '🔄',
      technologies: ['Fetch API', 'DOM Manipulation', 'Event Handling'],
      description: 'Send user input to backend, receive AI-generated content, update frontend dynamically. Demonstrate full-stack communication.'
    },
    {
      name: 'Mini Projects / Practice Exercises',
      order: 6,
      maxTime: 120,
      keyTags: ['Node.js', 'Express routes', 'fetch()/axios', 'JSON responses'],
      deliverable: '1 Video per mini-project: Demo working backend + explain code and API usage.',
      icon: '🛠️',
      technologies: ['Node.js', 'Express.js', 'Gemini API'],
      description: 'Practice building small backend APIs: AI Fun Facts, AI Daily Journal Prompter, AI Helper Bot with multiple endpoints. Apply async JS and Gemini API integration.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 7,
      maxTime: 30,
      keyTags: ['Full-Stack Review', 'Node.js Review'],
      deliverable: '1 Video: Demonstrate final full-stack "Ask Gemini" app + reflect on learning outcomes.',
      icon: '🎉',
      technologies: ['Node.js', 'Express.js', 'Gemini API'],
      description: 'Review Node.js, Express.js, backend routing, API integration, async operations, full-stack flow. Reflect on building a functional backend app with AI.'
    }
  ],
  'Phase 6: Student Feedback Manager': [
    {
      name: 'Project Introduction: Student Feedback Manager',
      order: 1,
      maxTime: 30,
      keyTags: ['Database Overview', 'MongoDB', 'Mongoose'],
      deliverable: 'No video – intro only',
      icon: '💬',
      technologies: ['MongoDB', 'Mongoose', 'Node.js'],
      description: 'Understand databases, NoSQL concepts, MongoDB for data storage, Mongoose for schema and model management.'
    },
    {
      name: 'MongoDB Setup & Connection',
      order: 2,
      maxTime: 45,
      keyTags: ['mongoose.connect()', '.env (dotenv)'],
      deliverable: '1 Video: Show database connection, explain .env usage, demonstrate successful connection.',
      icon: '🔌',
      technologies: ['MongoDB', 'Mongoose', 'Environment Variables'],
      description: 'Connect Node.js/Express app to MongoDB (local or Atlas). Keep connection string secure with environment variables.'
    },
    {
      name: 'Define Schema & Model',
      order: 3,
      maxTime: 60,
      keyTags: ['mongoose.Schema()', 'mongoose.model()'],
      deliverable: '1 Video: Explain schema, model, and why schemas structure data.',
      icon: '📋',
      technologies: ['Mongoose Schema', 'Mongoose Model'],
      description: 'Create a Mongoose schema for feedback (name, rating, comments). Build a model to interact with the database.'
    },
    {
      name: 'Storing New Feedback (Create)',
      order: 4,
      maxTime: 75,
      keyTags: ['new Model()', 'instance.save()', 'express.json()'],
      deliverable: '1 Video: Submit feedback via form → save to database → confirm stored data (MongoDB Compass or shell).',
      icon: '💾',
      technologies: ['Mongoose CRUD', 'Express.js', 'JSON Parsing'],
      description: 'Receive POST requests from frontend form, create a new document, save feedback to MongoDB.'
    },
    {
      name: 'Retrieving & Displaying Feedback (Read)',
      order: 5,
      maxTime: 60,
      keyTags: ['Model.find()', 'async/await', 'Express GET route'],
      deliverable: '1 Video: Fetch feedback → render on frontend → explain full data flow.',
      icon: '📖',
      technologies: ['Mongoose Queries', 'Async/Await', 'Express Routes'],
      description: 'Create route to fetch all feedback, send JSON to frontend, dynamically display feedback on "All Feedback" page.'
    },
    {
      name: 'Mini Projects / Practice Exercises',
      order: 6,
      maxTime: 120,
      keyTags: ['CRUD basics (Create & Read focus)', 'Express routes', 'Mongoose models'],
      deliverable: '1 Video per mini-project: Demo backend functionality, explain schema, routes, and database interactions.',
      icon: '🛠️',
      technologies: ['MongoDB', 'Mongoose', 'Express.js'],
      description: 'Build small apps to practice database integration: contact form collector, student progress tracker, quick notes saver. Use POST to store and GET to retrieve data.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 7,
      maxTime: 30,
      keyTags: ['MongoDB Review', 'Mongoose Review', 'Full-Stack Data Flow'],
      deliverable: '1 Video: Showcase final app, explain end-to-end data flow (frontend → backend → database → frontend).',
      icon: '🎉',
      technologies: ['MongoDB', 'Mongoose', 'Full-Stack Development'],
      description: 'Consolidate knowledge: connect frontend, backend, database; secure connection; handle user data persistently.'
    }
  ],
  'Phase 7: CollabSphere': [
    {
      name: 'Project Introduction: CollabSphere',
      order: 1,
      maxTime: 30,
      keyTags: ['Full-Stack Overview', 'AI Integration', 'SaaS Application'],
      deliverable: 'No video – intro only',
      icon: '🌍',
      technologies: ['Full-Stack Development', 'AI Integration', 'MongoDB'],
      description: 'Understand project scope: full-stack development, AI-powered collaboration, portfolio-ready SaaS application.'
    },
    {
      name: 'User Authentication System',
      order: 2,
      maxTime: 90,
      keyTags: ['bcrypt.js (password hashing)', 'JWT (auth)', 'Express routes', 'MongoDB'],
      deliverable: 'Video 1: Registration & Login demo, explain auth flow and JWT handling',
      icon: '🔐',
      technologies: ['JWT Authentication', 'bcrypt.js', 'MongoDB'],
      description: 'Secure user registration, login, JWT-protected routes, store users in MongoDB.'
    },
    {
      name: 'Project Creation & Collaboration',
      order: 3,
      maxTime: 75,
      keyTags: ['Express routes', 'MongoDB relations', 'Mongoose models'],
      deliverable: 'Video 2: Create project, add members, demo dashboard',
      icon: '👥',
      technologies: ['Express.js', 'MongoDB Relations', 'Mongoose'],
      description: 'Create projects, invite users as members, display user dashboard.'
    },
    {
      name: 'Markdown Notes Management',
      order: 4,
      maxTime: 90,
      keyTags: ['SimpleMDE editor', 'CRUD operations', 'MongoDB'],
      deliverable: 'Video 3: CRUD notes demo, save to DB, frontend interaction',
      icon: '📝',
      technologies: ['SimpleMDE', 'CRUD Operations', 'MongoDB'],
      description: 'Create, edit, save notes; basic collaboration logic.'
    },
    {
      name: 'Gemini AI Integration with Notes',
      order: 5,
      maxTime: 75,
      keyTags: ['Gemini API', 'Express backend routes', 'fetch/axios'],
      deliverable: 'Video 4: Gemini explain & suggestion demo, show backend API routes',
      icon: '🤖',
      technologies: ['Gemini API', 'Express.js', 'Fetch API'],
      description: 'Buttons to explain notes or suggest improvements via Gemini; backend handles API calls securely.'
    },
    {
      name: 'File Upload & Preview',
      order: 6,
      maxTime: 90,
      keyTags: ['Multer (or Cloudinary)', 'file handling', 'MongoDB references'],
      deliverable: 'Video 5: Upload demo, preview, Gemini code explanation',
      icon: '📁',
      technologies: ['Multer', 'File Handling', 'MongoDB'],
      description: 'Upload project files, basic preview, Gemini code explanation for supported files.'
    },
    {
      name: 'Contribution Analytics',
      order: 7,
      maxTime: 60,
      keyTags: ['Express GET routes', 'MongoDB queries', 'data aggregation'],
      deliverable: 'Video 6: Analytics demo, basic dashboard summary',
      icon: '📊',
      technologies: ['Express Routes', 'MongoDB Queries', 'Data Aggregation'],
      description: 'Track user activity: notes created, files uploaded, project contributions.'
    },
    {
      name: 'Public Shareable Project Page & README Generation',
      order: 8,
      maxTime: 75,
      keyTags: ['Public routes', 'Gemini API', 'Markdown generation'],
      deliverable: 'Video 7: Public project page demo, README generation using Gemini',
      icon: '📄',
      technologies: ['Gemini API', 'Markdown Generation', 'Public Routes'],
      description: 'Generate project README via Gemini, make project or README publicly viewable.'
    },
    {
      name: 'Mini Projects / Practice Exercises',
      order: 9,
      maxTime: 150,
      keyTags: ['Authentication', 'Collaborative Notes', 'README Generation'],
      deliverable: 'Optional videos for practice, helps prep final project',
      icon: '🛠️',
      technologies: ['Full-Stack Development', 'AI Integration'],
      description: '1) Authentication system, 2) Collaborative Markdown notes, 3) Gemini-powered README generator.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 10,
      maxTime: 45,
      keyTags: ['Full-Stack Flow', 'Security', 'AI Enhancement'],
      deliverable: 'Optional reflection video summarizing full app',
      icon: '🎉',
      technologies: ['Full-Stack Development', 'AI Integration', 'Deployment'],
      description: 'Consolidate all features, demonstrate end-to-end functionality, deployment readiness.'
    }
  ]
};

// Simplified topics for backward compatibility
export const initialTopics: { [phaseName: string]: Omit<Topic, 'id' | 'created_at' | 'phase_id'>[] } = {
  'Phase 1: Student Profile & Course Portal (HTML Only)': detailedTopics['Phase 1: Student Profile & Course Portal (HTML Only)'].map(topic => ({
    name: topic.name,
    order: topic.order
  })),
  'Phase 2: Styling & Responsive Design': detailedTopics['Phase 2: Styling & Responsive Design'].map(topic => ({
    name: topic.name,
    order: topic.order
  }))
};

// Goal templates for better guidance
export const goalTemplates: { [topicName: string]: string[] } = {
  '🏠 Home Page': [
    'Create HTML structure using <header>, <nav>, <main>, and <footer> tags',
    'Build a navigation menu with <ul>, <li>, and <a> elements',
    'Structure content with semantic HTML and proper heading hierarchy',
    'Complete the home page layout within 90 minutes and record walkthrough video'
  ],
  '👤 Profile Page': [
    'Add profile image using <img> tag with proper alt attributes',
    'Create profile information using <h2>/<h3> headings and lists',
    'Organize personal details with <ul>/<ol> and <li> elements',
    'Complete profile page within 75 minutes and record walkthrough video'
  ],
  '📚 Courses Page': [
    'Structure course listings using <h2>/<h3> headings',
    'Add course descriptions with <p> elements and proper content hierarchy',
    'Create course links using <a> tags for navigation',
    'Complete courses page within 75 minutes and record walkthrough video'
  ],
  '📝 Feedback Page': [
    'Build feedback form using <form>, <label>, and various <input> types',
    'Add text area for comments using <textarea> element',
    'Include dropdown selections with <select> and submit with <button>',
    'Complete feedback form within 90 minutes and record walkthrough video'
  ],
  '📊 Grades Table Page': [
    'Create grades table using <table>, <thead>, and <tbody> structure',
    'Add table caption with <caption> and organize data with <tr>, <th>, <td>',
    'Structure tabular data properly for accessibility and readability',
    'Complete grades table within 60 minutes and record walkthrough video'
  ],
  '📞 Contact Us Page': [
    'Add contact information using <p> and <h2>/<h3> elements',
    'Create clickable email links using <a> with mailto: protocol',
    'Add phone links using <a> with tel: protocol for mobile compatibility',
    'Complete contact page within 45 minutes and record walkthrough video'
  ],
  '🔗 Conceptual Review': [
    'Demonstrate understanding of HTML document structure and semantic elements',
    'Show how all pages link together using proper navigation',
    'Explain the relationship between different HTML elements used',
    'Record concept video explaining the complete project structure'
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

// Helper function to get topic details
export const getTopicDetails = (phaseName: string, topicName: string): TopicDetails | null => {
  const phaseTopics = detailedTopics[phaseName];
  if (!phaseTopics) return null;
  
  return phaseTopics.find(topic => topic.name === topicName) || null;
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