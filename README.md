# Campus Learning Dashboard

A comprehensive full-stack web application for academic tracking and student progress management, built with React (frontend) and Firebase (Firestore + Auth).

## Features

### 🎓 Student Features
- **Daily Goal Setting**: Select phase/topic and set learning objectives with target achievement percentages
- **Evening Reflections**: Submit daily reflections with actual achievement percentages
- **Journey Snapshot**: View learning timeline, phase/topic progress, and attendance tracking
- **Pair Programming**: Request pair programming sessions (1 per day)
- **Leave Management**: Self-report leaves with automatic attendance adjustment
- **Progress Dashboard**: Visual progress bars, achievement tracking, and mentor feedback

### 👨‍🏫 Mentor/Academic Associate Features
- **Mentee Management**: View assigned students and their progress
- **Goal Review**: Review and approve student morning goals
- **Reflection Review**: Review evening reflections and provide feedback
- **Attendance Tracking**: Mark attendance based on goal/reflection reviews
- **Pair Programming**: Pick up and manage pair programming sessions
- **Mobile-Friendly**: Responsive design optimized for mobile use

### 👩‍💼 Admin Features
- **Campus Overview**: View campus-wide student progress and statistics
- **Configuration**: Manage phases, topics, modules, and timelines
- **Mentor Allocation**: Oversee mentor-mentee assignments
- **Analytics**: Attendance summaries, leave reports, and pair programming stats
- **Web Dashboard**: Comprehensive admin interface (web-only)

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with mobile-first responsive design
- **Backend**: Firebase (Firestore + Authentication)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Routing**: React Router v6

## Project Structure

```
src/
├── components/
│   ├── Common/          # Shared components (Navigation, Layout, Auth)
│   ├── Student/         # Student-specific components
│   ├── Mentor/          # Mentor-specific components
│   └── Admin/           # Admin-specific components
├── contexts/            # React contexts (Auth)
├── services/            # Firebase services and API calls
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
└── utils/               # Utility functions
```

## Database Schema (Firestore Collections)

1. **users**: User profiles with roles (student/mentor/admin)
2. **phases**: Learning phases with timelines
3. **topics**: Topics within each phase
4. **daily_goals**: Student daily goals
5. **daily_reflections**: Student evening reflections
6. **pair_programming_requests**: Pair programming session requests
7. **attendance**: Daily attendance records
8. **mentor_notes**: Mentor feedback and notes
9. **leave_requests**: Student leave applications
10. **student_progress**: Phase/topic progress tracking

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-learning-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Get your Firebase configuration

4. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Replace the Firebase configuration values with your actual Firebase config:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Firestore Security Rules**
   - Deploy the security rules from `firestore.rules` to your Firebase project
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Initial Data Setup**
   - Create initial phases and topics in Firestore
   - Create admin user account through the signup process

### Running the Application

```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

The application will be available at `http://localhost:3000`.

## User Roles & Access

### Student Access
- Dashboard: Progress overview, daily stats
- Goals: Set and view daily learning objectives
- Reflections: Submit evening reflections
- Journey: View learning timeline and progress
- Pair Programming: Request sessions

### Mentor Access  
- Dashboard: Mentee overview and pending tasks
- Mentees: Review goals and reflections
- Pair Programming: Manage session requests
- Mobile-optimized interface

### Admin Access
- Campus: Institution-wide analytics
- Settings: Configure phases, topics, users
- Reports: Attendance, leaves, performance
- Web-only comprehensive dashboard

## Key Features Implementation

### Authentication & Authorization
- Firebase Authentication with email/password
- Role-based access control (RBAC)
- Protected routes based on user roles
- Automatic redirection based on authentication state

### Real-time Data
- Firestore real-time listeners for live updates
- Automatic UI updates when data changes
- Optimistic updates for better UX

### Mobile-First Design
- Responsive layout with Tailwind CSS
- Touch-friendly interface for mobile users
- Progressive Web App capabilities

### Notification System
- Mentor reminder notifications for pending reviews
- Email integration ready for implementation
- In-app notification system

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## Future Enhancements

- **AI Integration**: Smart mentor-mentee matching based on skills
- **Advanced Analytics**: Weekly insights and performance predictions
- **Mobile Apps**: Native iOS/Android applications
- **Offline Support**: PWA with offline capabilities
- **Integration APIs**: Connect with external learning platforms
- **Advanced Reporting**: Export capabilities and detailed analytics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository or contact the development team.