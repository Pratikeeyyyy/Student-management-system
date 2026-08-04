import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import { Calendar, User } from 'lucide-react';
import type { Course } from '../types';

export const Timetable: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    getDocs(collection(db, 'courses')).then(snap => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>), enrolled: [] })));
    }).catch(() => toast('Could not load the timetable.', 'error'));
  }, [toast]);

  const scheduled = courses.filter(c => c.schedule);
  const unscheduled = courses.filter(c => !c.schedule);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1 className="header-title">Timetable</h1>
          <p className="muted" style={{ marginTop: '0.25rem' }}>{scheduled.length} of {courses.length} courses scheduled.</p>
        </div>
      </div>

      {scheduled.length === 0 && courses.length > 0 && (
        <div className="glass-panel">
          <div className="empty-state">
            <Calendar size={36} />
            None of your courses have a schedule yet. Edit a course to add one.
          </div>
        </div>
      )}

      {scheduled.length > 0 && (
        <div className="grid-cards">
          {scheduled.map(course => (
            <div key={course.id} className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{course.name}</h3>
              <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.9rem' }}>
                <User size={15} /> {course.teacher}
              </p>
              <span className="schedule-chip"><Calendar size={16} /> {course.schedule}</span>
            </div>
          ))}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h2 className="section-title" style={{ color: 'var(--text-secondary)' }}>Unassigned courses</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {unscheduled.map(course => (
              <span key={course.id} className="badge badge-warning">{course.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
