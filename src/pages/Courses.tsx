import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { Trash2, Edit, Users, UserCheck } from 'lucide-react';
import type { Course, Student } from '../types';

const emptyForm = { name: '', teacher: '', schedule: '' };

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'courses'));
      setCourses(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>), enrolled: (d.data().enrolled as string[]) || [] })));
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast('Could not load courses.', 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadCourses();
    getDocs(collection(db, 'students')).then(snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    }).catch(() => toast('Could not load students.', 'error'));
  }, [loadCourses, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'courses', editingId), form);
        toast('Course updated.');
      } else {
        await addDoc(collection(db, 'courses'), form);
        toast('Course created.');
      }
      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      toast('Could not save the course.', 'error');
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Delete "${course.name}"? Any linked grades and attendance will be orphaned.`)) return;
    try {
      await deleteDoc(doc(db, 'courses', course.id));
      toast('Course deleted.');
      loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast('Could not delete the course.', 'error');
    }
  };

  const openEnroll = (course: Course) => {
    setActiveCourse(course);
    setSelectedIds(course.enrolled);
    setIsEnrollOpen(true);
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveEnrollments = async () => {
    if (!activeCourse) return;
    try {
      await updateDoc(doc(db, 'courses', activeCourse.id), { enrolled: selectedIds });
      toast(`Enrollment updated for ${activeCourse.name}.`);
      setIsEnrollOpen(false);
      loadCourses();
    } catch (error) {
      console.error('Failed to save enrollments:', error);
      toast('Could not save enrollments.', 'error');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({ name: course.name, teacher: course.teacher, schedule: course.schedule });
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1 className="header-title">Courses</h1>
        <button className="btn" onClick={openCreate}>Add Course</button>
      </div>

      <div className="grid-cards">
        {loading ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">Loading courses...</div>
          </div>
        ) : courses.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">No courses yet. Create one to get started.</div>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{course.name}</h3>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="icon-btn" onClick={() => openEdit(course)} aria-label="Edit course">
                    <Edit size={15} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(course)} aria-label="Delete course">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="muted" style={{ fontSize: '0.95rem' }}>Teacher: {course.teacher}</p>
              <p className="muted" style={{ fontSize: '0.95rem' }}>Schedule: {course.schedule || 'TBD'}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                <UserCheck size={16} color="var(--success-color)" /> {course.enrolled.length} student{course.enrolled.length === 1 ? '' : 's'} enrolled
              </p>
              <button className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }} onClick={() => openEnroll(course)}>
                <Users size={18} /> Manage Enrollments
              </button>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Course name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Teacher</label>
            <input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Schedule</label>
            <input type="text" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">{editingId ? 'Save Changes' : 'Create Course'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} title={activeCourse ? `Enroll students in ${activeCourse.name}` : 'Enrollments'}>
        {students.length === 0 ? (
          <div className="empty-state">Add students first, then come back to enroll them.</div>
        ) : (
          <>
            <div className="checklist">
              {students.map(s => (
                <label key={s.id} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span className="muted" style={{ fontSize: '0.85rem' }}>{s.grade}</span>
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsEnrollOpen(false)}>Cancel</button>
              <button type="button" className="btn" onClick={saveEnrollments}>
                <UserCheck size={18} /> Save ({selectedIds.length})
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Courses;
