import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../hooks/useConfirm';
import { Trash2, Edit, FileText, CheckCircle } from 'lucide-react';
import type { Assignment, Course } from '../types';

export const Assignments: React.FC = () => {
  const { userRole, currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [confirmEl, confirm] = useConfirm();

  const canManage = userRole === 'admin' || userRole === 'teacher';

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'assignments'));
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Assignment, 'id'>) }));
      data.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast('Could not load assignments.', 'error');
    }
    setLoading(false);
  }, [toast]);

  const loadCourses = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>), enrolled: [] }));
      setCourses(data);
      setCourse(prev => prev || data[0]?.name || '');
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'assignment_submissions'), where('studentId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const subs: Record<string, boolean> = {};
      snap.forEach(d => { subs[d.data().assignmentId] = true; });
      setSubmissions(subs);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAssignments();
    loadCourses();
    loadSubmissions();
  }, [loadAssignments, loadCourses, loadSubmissions]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCourse(courses[0]?.name || '');
    setDueDate('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { title, description, course, dueDate };
      if (editingId) {
        await updateDoc(doc(db, 'assignments', editingId), payload);
        toast('Assignment updated.');
      } else {
        await addDoc(collection(db, 'assignments'), payload);
        toast('Assignment created.');
      }
      setIsModalOpen(false);
      resetForm();
      loadAssignments();
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast('Could not save the assignment.', 'error');
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    const ok = await confirm(`Delete "${assignment.title}"?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'assignments', assignment.id));
      toast('Assignment deleted.');
      loadAssignments();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast('Could not delete the assignment.', 'error');
    }
  };

  const handleMarkDone = async (assignment: Assignment) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'assignment_submissions'), {
        assignmentId: assignment.id,
        studentId: currentUser.uid,
        submittedAt: new Date().toISOString(),
      });
      setSubmissions(prev => ({ ...prev, [assignment.id]: true }));
      toast('Marked as done.');
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      toast('Could not mark the assignment.', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1 className="header-title">Assignments</h1>
        {canManage && (
          <button className="btn" onClick={() => { resetForm(); setIsModalOpen(true); }}>Create Assignment</button>
        )}
      </div>

      <div className="grid-cards">
        {loading ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">Loading assignments...</div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <FileText size={36} />
              No assignments yet.
            </div>
          </div>
        ) : (
          assignments.map(assignment => {
            const overdue = new Date(assignment.dueDate) < new Date();
            return (
              <div key={assignment.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                    {assignment.title}
                  </h3>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="icon-btn" onClick={() => {
                        setEditingId(assignment.id);
                        setTitle(assignment.title);
                        setDescription(assignment.description);
                        setCourse(assignment.course);
                        setDueDate(assignment.dueDate);
                        setIsModalOpen(true);
                      }} aria-label="Edit assignment">
                        <Edit size={15} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(assignment)} aria-label="Delete assignment">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ fontWeight: 500, marginBottom: '0.4rem' }}>{assignment.course}</p>
                <p className="muted" style={{ marginBottom: '1rem', flex: 1 }}>{assignment.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.9rem' }}>
                  <span className={overdue ? 'badge badge-danger' : 'badge badge-warning'}>
                    due {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                  {!canManage && (
                    submissions[assignment.id] ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={14} /> Submitted
                      </span>
                    ) : (
                      <button className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={() => handleMarkDone(assignment)}>
                        Mark as done
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Assignment' : 'Create Assignment'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Course</label>
            <select value={course} onChange={e => setCourse(e.target.value)} required>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">{editingId ? 'Save Changes' : 'Create'}</button>
          </div>
        </form>
      </Modal>
      {confirmEl}
    </div>
  );
};

export default Assignments;
