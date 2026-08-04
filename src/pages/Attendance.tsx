import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import { CheckSquare, Save } from 'lucide-react';
import type { Course, Student, AttendanceStatus } from '../types';

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late'];

export const Attendance: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getDocs(collection(db, 'courses')).then(snap => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>), enrolled: (d.data().enrolled as string[]) || [] })));
    }).catch(() => toast('Could not load courses.', 'error'));
  }, [toast]);

  const loadRoster = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const course = courses.find(c => c.id === selectedCourse);
      setEnrolledIds(course?.enrolled || []);

      const [sSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(query(collection(db, 'attendance'), where('courseId', '==', selectedCourse))),
      ]);
      const all = sSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
      setStudents(all);

      const takenToday = aSnap.docs.some(d => d.data().date === date);
      setAlreadyTaken(takenToday);

      setStatuses(() => {
        const defaults: Record<string, AttendanceStatus> = {};
        const roster = (course?.enrolled || []).map(id => all.find(s => s.id === id)).filter(Boolean) as Student[];
        roster.forEach(s => { defaults[s.id] = 'present'; });
        return defaults;
      });
    } catch (error) {
      console.error('Failed to load roster:', error);
      toast('Could not load the roster.', 'error');
    }
    setLoading(false);
  }, [selectedCourse, date, courses, toast]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster, selectedCourse, date]);

  const roster = enrolledIds.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[];

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    setStatuses(prev => {
      const next = { ...prev };
      roster.forEach(s => { next[s.id] = status; });
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedCourse) return toast('Please select a course first.', 'error');
    setSaving(true);
    try {
      await addDoc(collection(db, 'attendance'), {
        courseId: selectedCourse,
        date,
        records: statuses,
        timestamp: new Date(),
      });
      toast('Attendance saved.');
      setAlreadyTaken(true);
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast('Could not save attendance.', 'error');
    }
    setSaving(false);
  };

  const presentCount = Object.values(statuses).filter(s => s === 'present').length;
  const absentCount = Object.values(statuses).filter(s => s === 'absent').length;
  const lateCount = Object.values(statuses).filter(s => s === 'late').length;

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1 className="header-title">Take Attendance</h1>
        <button className="btn" onClick={handleSave} disabled={saving || !selectedCourse}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Course</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="">Select a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        {selectedCourse && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }} onClick={() => markAll('present')}>All present</button>
            <button className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }} onClick={() => markAll('absent')}>All absent</button>
            {alreadyTaken && <span className="badge badge-warning" style={{ alignSelf: 'center' }}>Already recorded today</span>}
          </div>
        )}
      </div>

      {selectedCourse && (
        <div className="glass-panel table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                {STATUSES.map(s => (
                  <th key={s} className="num" style={{ textTransform: 'capitalize' }}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><div className="empty-state">Loading roster...</div></td></tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <CheckSquare size={36} />
                      No students are enrolled in this course yet. Head to Courses to add some.
                    </div>
                  </td>
                </tr>
              ) : (
                roster.map(student => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    {STATUSES.map(s => (
                      <td key={s} className="num">
                        <input
                          type="radio"
                          name={`status-${student.id}`}
                          checked={(statuses[student.id] || 'present') === s}
                          onChange={() => handleStatusChange(student.id, s)}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && roster.length > 0 && (
            <div style={{ display: 'flex', gap: '1.25rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
              <span className="badge badge-success">{presentCount} present</span>
              <span className="badge badge-danger">{absentCount} absent</span>
              <span className="badge badge-warning">{lateCount} late</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
