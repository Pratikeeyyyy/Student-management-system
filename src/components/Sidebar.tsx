import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, LogOut, CheckSquare, Award,
  Calendar, ShieldAlert, FileText, Video, Menu, X, GraduationCap,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { userRole, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const close = () => setOpen(false);

  const canManage = userRole === 'admin' || userRole === 'teacher';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <button className="menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <div className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <div className="sidebar-logo">
            <GraduationCap className="icon" />
            <span>Learning with Pratik</span>
          </div>
          <button className="sidebar-close" onClick={close} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" className={linkClass} end onClick={close}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          {canManage && (
            <NavLink to="/students" className={linkClass} onClick={close}>
              <Users size={20} /> Students
            </NavLink>
          )}
          <NavLink to="/courses" className={linkClass} onClick={close}>
            <BookOpen size={20} /> Courses
          </NavLink>
          {canManage && (
            <NavLink to="/attendance" className={linkClass} onClick={close}>
              <CheckSquare size={20} /> Attendance
            </NavLink>
          )}
          {canManage && (
            <NavLink to="/grades" className={linkClass} onClick={close}>
              <Award size={20} /> Grades
            </NavLink>
          )}
          <NavLink to="/assignments" className={linkClass} onClick={close}>
            <FileText size={20} /> Assignments
          </NavLink>
          <NavLink to="/lectures" className={linkClass} onClick={close}>
            <Video size={20} /> Lectures
          </NavLink>
          <NavLink to="/timetable" className={linkClass} onClick={close}>
            <Calendar size={20} /> Timetable
          </NavLink>
          {userRole === 'admin' && (
            <NavLink to="/users" className={linkClass} onClick={close}>
              <ShieldAlert size={20} /> Users
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <span className="avatar">{initial}</span>
            <span style={{ flex: 1 }}>{displayName}</span>
            <span className="user-role">{userRole || 'pending'}</span>
          </div>
          <button onClick={handleLogout} className="nav-link">
            <LogOut size={20} /> Logout
          </button>
          <p className="sidebar-copyright">
            © {new Date().getFullYear()} Learning with Pratik
          </p>
        </div>
      </div>

      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={close} />
    </>
  );
};
