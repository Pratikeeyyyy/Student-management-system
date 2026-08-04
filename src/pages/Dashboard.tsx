import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, BookOpen, FileText, Download, ClipboardList, GraduationCap } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { Student, Assignment, Course } from '../types';

interface Stats {
  students: number;
  courses: number;
  assignments: number;
  avgScore: number;
}

const emptyStats: Stats = { students: 0, courses: 0, assignments: 0, avgScore: 0 };

export const Dashboard: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [sSnap, cSnap, aSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'assignments')),
        ]);

        const students = sSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
        setAllStudents(students);

        let avgScore = 0;
        let courseCount = cSnap.size;
        let myCourseNames: string[] = [];

        if (userRole === 'student' && currentUser) {
          const myRecord = await getDocs(query(collection(db, 'students'), where('uid', '==', currentUser.uid)));
          const studentId = myRecord.docs[0]?.id;
          if (studentId) {
            const gSnap = await getDocs(query(collection(db, 'grades'), where('studentId', '==', studentId)));
            const scores = gSnap.docs.map(d => Number(d.data().score || 0));
            avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

            const allCourses = cSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>), enrolled: (d.data().enrolled as string[]) || [] }));
            myCourseNames = allCourses.filter(c => c.enrolled.includes(studentId)).map(c => c.name);
            courseCount = myCourseNames.length;
          }
        } else {
          const gSnap = await getDocs(collection(db, 'grades'));
          const scores = gSnap.docs.map(d => Number(d.data().score || 0));
          avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        }

        const assignments = aSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Assignment, 'id'>) }));
        const visible = userRole === 'student' ? assignments.filter(a => myCourseNames.includes(a.course)) : assignments;
        visible.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        setRecentAssignments(visible.slice(0, 5));

        setStats({
          students: students.length,
          courses: courseCount,
          assignments: visible.length,
          avgScore: Math.round(avgScore * 10) / 10,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    loadDashboard();
  }, [userRole, currentUser]);

  const exportToCSV = () => {
    if (allStudents.length === 0) return;
    const rows = [
      ['Name', 'Email', 'Grade'],
      ...allStudents.map(s => [s.name, s.email, s.grade]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there';

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1 className="header-title">{greeting}, {displayName}</h1>
          <p className="muted" style={{ marginTop: '0.25rem' }}>
            Here is what is happening at {userRole === 'admin' ? 'your school' : 'your classes'} today.
          </p>
        </div>
        <div className="header-actions">
          {userRole === 'admin' && (
            <button className="btn btn-secondary" onClick={exportToCSV}>
              <Download size={18} /> Export students
            </button>
          )}
          <div className="user-profile">
            <span>{currentUser?.email}</span>
            <span className="user-role">{userRole}</span>
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <div className="card-title"><Users size={24} color="var(--primary-color)" /> Students</div>
          <div className="card-value">{stats.students}</div>
        </div>
        <div className="card">
          <div className="card-title"><BookOpen size={24} color="var(--success-color)" /> Courses</div>
          <div className="card-value">{stats.courses}</div>
        </div>
        <div className="card">
          <div className="card-title"><FileText size={24} color="var(--warning-color)" /> Assignments</div>
          <div className="card-value">{stats.assignments}</div>
        </div>
        <div className="card">
          <div className="card-title">
            {userRole === 'student' ? <GraduationCap size={24} color="var(--danger-color)" /> : <GraduationCap size={24} color="var(--danger-color)" />}
            {userRole === 'student' ? 'My average' : 'Average score'}
          </div>
          <div className="card-value">{stats.avgScore ? `${stats.avgScore}%` : '—'}</div>
        </div>
      </div>

      {recentAssignments.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div className="section-title"><ClipboardList size={20} color="var(--primary-color)" /> Recent assignments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentAssignments.map(a => (
              <div key={a.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: '0.9rem' }}>{a.course}</div>
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <span className={new Date(a.dueDate) < new Date() ? 'badge badge-danger' : 'badge badge-warning'}>
                    {new Date(a.dueDate) < new Date() ? 'overdue' : 'due'} {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
