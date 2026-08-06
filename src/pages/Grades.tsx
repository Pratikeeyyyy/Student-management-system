import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { Trash2, Edit, Award } from 'lucide-react';
import type { Course, Student, Grade } from '../types';

export const Grades: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [assessment, setAssessment] = useState('');
  const [score, setScore] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [confirmEl, confirm] = useConfirm();

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'students')),
    ]).then(([cSnap, sSnap]) => {
      setCourses(cSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>), enrolled: [] })));
      setStudents(sSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    }).catch(() => toast('Could not load courses and students.', 'error'));
  }, [toast]);

  const loadGrades = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'grades'), where('courseId', '==', courseId));
      const snap = await getDocs(q);
      setGrades(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Grade, 'id'>) })));
    } catch (error) {
      console.error('Failed to load grades:', error);
      toast('Could not load grades.', 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (selectedCourse) loadGrades(selectedCourse);
    else setGrades([]);
  }, [selectedCourse, loadGrades]);

  const resetForm = () => {
    setSelectedStudent('');
    setAssessment('');
    setScore('');
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (grade: Grade) => {
    setEditingId(grade.id);
    setSelectedStudent(grade.studentId);
    setAssessment(grade.assessment);
    setScore(String(grade.score));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { courseId: selectedCourse, studentId: selectedStudent, assessment, score: Number(score) };
      if (editingId) {
        await updateDoc(doc(db, 'grades', editingId), payload);
        toast('Grade updated.');
      } else {
        await addDoc(collection(db, 'grades'), { ...payload, timestamp: new Date() });
        toast('Grade recorded.');
      }
      setIsModalOpen(false);
      resetForm();
      loadGrades(selectedCourse);
    } catch (error) {
      console.error('Failed to save grade:', error);
      toast('Could not save the grade.', 'error');
    }
  };

  const handleDelete = async (grade: Grade) => {
    const ok = await confirm(`Delete this ${grade.assessment} grade for ${studentName(grade.studentId)}?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'grades', grade.id));
      toast('Grade deleted.');
      loadGrades(selectedCourse);
    } catch (error) {
      console.error('Failed to delete grade:', error);
      toast('Could not delete the grade.', 'error');
    }
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';

  const gradeColor = (score: number) => {
    if (score >= 90) return 'var(--success-color)';
    if (score >= 70) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1 className="header-title">Grades</h1>
        <button className="btn" onClick={openCreate} disabled={!selectedCourse}>Record Grade</button>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label>Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">Choose a course...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {selectedCourse && (
        <div className="glass-panel table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assessment</th>
                <th className="num">Score</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><div className="empty-state">Loading grades...</div></td></tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <Award size={36} />
                      No grades recorded for this course yet.
                    </div>
                  </td>
                </tr>
              ) : (
                grades.map(grade => (
                  <tr key={grade.id}>
                    <td style={{ fontWeight: 500 }}>{studentName(grade.studentId)}</td>
                    <td className="muted">{grade.assessment}</td>
                    <td className="num" style={{ color: gradeColor(grade.score), fontWeight: 700 }}>{grade.score}%</td>
                    <td className="actions">
                      <button className="icon-btn" onClick={() => openEdit(grade)} aria-label="Edit grade">
                        <Edit size={16} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(grade)} aria-label="Delete grade">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Grade' : 'Record Grade'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Student</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required>
              <option value="">Select student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Assessment</label>
            <input type="text" value={assessment} onChange={e => setAssessment(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Score (%)</label>
            <input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">{editingId ? 'Save Changes' : 'Save Grade'}</button>
          </div>
        </form>
      </Modal>
      {confirmEl}
    </div>
  );
};

export default Grades;
