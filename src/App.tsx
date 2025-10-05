import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Common Components
import ProtectedRoute from './components/Common/ProtectedRoute';
import Layout from './components/Common/Layout';
import Login from './components/Common/Login';
import Dashboard from './components/Common/Dashboard';

// Student Components
import StudentDashboard from './components/Student/StudentDashboard';
import GoalSetting from './components/Student/GoalSetting';
import ReflectionSubmission from './components/Student/ReflectionSubmission';

// Mentor Components
import MentorDashboard from './components/Mentor/MentorDashboard';
import MentorMenteeReview from './components/Mentor/MentorMenteeReview';
import PairProgrammingManagement from './components/Mentor/PairProgrammingManagement';

// Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';

// Error Components
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">401</h1>
      <p className="text-xl text-gray-600 mb-4">Unauthorized Access</p>
      <p className="text-gray-500">You don't have permission to access this page.</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-4">Page Not Found</p>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <StudentDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/goals" element={
              <ProtectedRoute>
                <Layout>
                  <GoalSetting />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/goal-setting" element={
              <ProtectedRoute>
                <Layout>
                  <GoalSetting />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/reflection" element={
              <ProtectedRoute>
                <Layout>
                  <ReflectionSubmission />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Mentor Routes */}
            <Route path="/mentor/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <MentorDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/mentor/mentee/:studentId" element={
              <ProtectedRoute>
                <Layout>
                  <MentorMenteeReview />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/mentor/review/:studentId" element={
              <ProtectedRoute>
                <Layout>
                  <MentorMenteeReview />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/mentor/pair-programming" element={
              <ProtectedRoute>
                <Layout>
                  <PairProgrammingManagement />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Legacy Routes Redirects */}
            <Route path="/mentees" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Redirecting...</h2>
                    <p className="text-gray-600 mt-2">Please use /mentor/dashboard</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/pair-programming" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Pair Programming</h2>
                    <p className="text-gray-600 mt-2">Please use /mentor/pair-programming</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Learning Journey */}
            <Route path="/journey" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Learning Journey</h2>
                    <p className="text-gray-600 mt-2">Coming Soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
