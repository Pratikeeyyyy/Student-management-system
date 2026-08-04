import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Edit, ShieldAlert, UserPlus } from 'lucide-react';
import type { AppUser, Role } from '../types';

export const UserManagement: React.FC = () => {
  const { userRole } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AppUser, 'id'>) })));
    } catch (error) {
      console.error('Failed to load users:', error);
      toast('Could not load users.', 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (userRole === 'admin') loadUsers();
  }, [userRole, loadUsers]);

  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setSelectedRole(user.role || 'student');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), { role: selectedRole });
      toast(`Role updated for ${editingUser.name || editingUser.email}.`);
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast('Could not update the role.', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1 className="header-title">Users</h1>
        <div className="header-actions">
          <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            <UserPlus size={16} /> New accounts can sign up on the login page.
          </span>
        </div>
      </div>

      <div className="glass-panel table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}><div className="empty-state">Loading users...</div></td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <ShieldAlert size={36} />
                    No user accounts yet.
                  </div>
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.name || '—'}</td>
                  <td className="muted">{user.email || '—'}</td>
                  <td>
                    <span className={`badge badge-${user.role || 'student'}`}>{user.role || 'student'}</span>
                  </td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => openEdit(user)} aria-label="Edit role">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Change role: ${editingUser?.name || editingUser?.email || ''}`}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Role</label>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as Role)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
