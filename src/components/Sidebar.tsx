import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, LogOut, CheckSquare, Award,
  Calendar, ShieldAlert, FileText, Video,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { userRole, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const canManage = userRole === 'admin' || userRole === 'teacher';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <BookOpen className="icon" /> EduSMS
      </div>

      <nav className="nav-links">
        <NavLink to="/dashboard" className={linkClass} end>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        {canManage && (
          <NavLink to="/students" className={linkClass}>
            <Users size={20} /> Students
          </NavLink>
        )}
        <NavLink to="/courses" className={linkClass}>
          <BookOpen size={20} /> Courses
        </NavLink>
        {canManage && (
          <NavLink to="/attendance" className={linkClass}>
            <CheckSquare size={20} /> Attendance
          </NavLink>
        )}
        {canManage && (
          <NavLink to="/grades" className={linkClass}>
            <Award size={20} /> Grades
          </NavLink>
        )}
        <NavLink to="/assignments" className={linkClass}>
          <FileText size={20} /> Assignments
        </NavLink>
        <NavLink to="/lectures" className={linkClass}>
          <Video size={20} /> Lectures
        </NavLink>
        <NavLink to="/timetable" className={linkClass}>
          <Calendar size={20} /> Timetable
        </NavLink>
        {userRole === 'admin' && (
          <NavLink to="/users" className={linkClass}>
            <ShieldAlert size={20} /> Users
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" style={{ marginBottom: '0.75rem', justifyContent: 'space-between' }}>
          <span>{currentUser?.displayName || currentUser?.email || 'Guest'}</span>
          <span className="user-role">{userRole || 'pending'}</span>
        </div>
        <button onClick={handleLogout} className="nav-link">
          <LogOut size={20} /> Logout
        </button>
        <p className="muted" style={{ fontSize: '0.75rem', padding: '0.75rem 1rem 0 1rem', color: 'rgba(255,255,255,0.4)' }}>
          © {new Date().getFullYear()} EduSMS
        </p>
      </div>
    </div>
  );
};
