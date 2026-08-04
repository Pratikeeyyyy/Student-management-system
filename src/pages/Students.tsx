import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { Trash2, Edit, Search, Users } from 'lucide-react';
import type { Student } from '../types';

const emptyForm = { name: '', email: '', grade: '' };

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'students'));
      setStudents(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    } catch (error) {
      console.error('Failed to load students:', error);
      toast('Could not load students.', 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'students', editingId), form);
        toast('Student updated.');
      } else {
        await addDoc(collection(db, 'students'), form);
        toast('Student added.');
      }
      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadStudents();
    } catch (error) {
      console.error('Failed to save student:', error);
      toast('Could not save the student.', 'error');
    }
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'students', student.id));
      toast('Student deleted.');
      loadStudents();
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast('Could not delete the student.', 'error');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditingId(student.id);
    setForm({ name: student.name, email: student.email, grade: student.grade });
    setIsModalOpen(true);
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.grade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1 className="header-title">Students</h1>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn" onClick={openCreate}>Add Student</button>
        </div>
      </div>

      <div className="glass-panel table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Grade</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}><div className="empty-state">Loading students...</div></td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <Users size={36} />
                    {students.length === 0 ? 'No students yet. Add your first one.' : 'Nothing matches your search.'}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: 500 }}>{student.name}</td>
                  <td className="muted">{student.email}</td>
                  <td><span className="badge badge-student">{student.grade}</span></td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => openEdit(student)} aria-label="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(student)} aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Grade / cohort</label>
            <input type="text" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">{editingId ? 'Save Changes' : 'Add Student'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Students;
