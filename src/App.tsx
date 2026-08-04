import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Courses = lazy(() => import('./pages/Courses'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Grades = lazy(() => import('./pages/Grades'));
const Timetable = lazy(() => import('./pages/Timetable'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Assignments = lazy(() => import('./pages/Assignments'));
const Lectures = lazy(() => import('./pages/Lectures'));

const PageLoader = () => (
  <div className="empty-state" style={{ paddingTop: '4rem' }}>Loading...</div>
);

const Layout = () => (
  <div className="app-container">
    <Sidebar />
    <main className="main-content">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/lectures" element={<Lectures />} />
                <Route path="/timetable" element={<Timetable />} />

                <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><Students /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><Attendance /></ProtectedRoute>} />
                <Route path="/grades" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><Grades /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
