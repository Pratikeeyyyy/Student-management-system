import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../hooks/useConfirm';
import { Trash2, Edit, Video, Clock, ExternalLink } from 'lucide-react';
import type { Lecture, Course } from '../types';

export const Lectures: React.FC = () => {
  const { userRole } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [topic, setTopic] = useState('');
  const [course, setCourse] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [confirmEl, confirm] = useConfirm();

  const canManage = userRole === 'admin' || userRole === 'teacher';

  const loadLectures = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'lectures'));
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Lecture, 'id'>) }));
      data.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      setLectures(data);
    } catch (error) {
      console.error('Failed to load lectures:', error);
      toast('Could not load lectures.', 'error');
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

  useEffect(() => {
    loadLectures();
    loadCourses();
  }, [loadLectures, loadCourses]);

  const resetForm = () => {
    setTopic('');
    setCourse(courses[0]?.name || '');
    setDate('');
    setTime('');
    setMeetingLink('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { topic, course, date, time, meetingLink };
      if (editingId) {
        await updateDoc(doc(db, 'lectures', editingId), payload);
        toast('Lecture updated.');
      } else {
        await addDoc(collection(db, 'lectures'), payload);
        toast('Lecture scheduled.');
      }
      setIsModalOpen(false);
      resetForm();
      loadLectures();
    } catch (error) {
      console.error('Failed to save lecture:', error);
      toast('Could not save the lecture.', 'error');
    }
  };

  const handleDelete = async (lecture: Lecture) => {
    const ok = await confirm(`Delete the lecture "${lecture.topic}"?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'lectures', lecture.id));
      toast('Lecture deleted.');
      loadLectures();
    } catch (error) {
      console.error('Failed to delete lecture:', error);
      toast('Could not delete the lecture.', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1 className="header-title">Lectures</h1>
        {canManage && (
          <button className="btn" onClick={() => { resetForm(); setIsModalOpen(true); }}>Schedule Lecture</button>
        )}
      </div>

      <div className="grid-cards">
        {loading ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">Loading lectures...</div>
          </div>
        ) : lectures.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <Video size={36} />
              No lectures scheduled yet.
            </div>
          </div>
        ) : (
          lectures.map(lecture => (
            <div key={lecture.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-color)' }}>{lecture.topic}</h3>
                {canManage && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="icon-btn" onClick={() => {
                      setEditingId(lecture.id);
                      setTopic(lecture.topic);
                      setCourse(lecture.course);
                      setDate(lecture.date);
                      setTime(lecture.time);
                      setMeetingLink(lecture.meetingLink);
                      setIsModalOpen(true);
                    }} aria-label="Edit lecture">
                      <Edit size={15} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(lecture)} aria-label="Delete lecture">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <p style={{ fontWeight: 500 }}>{lecture.course}</p>
              <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Clock size={15} /> {new Date(`${lecture.date}T${lecture.time}`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              {lecture.meetingLink ? (
                <a href={lecture.meetingLink} target="_blank" rel="noopener noreferrer" style={{ marginTop: 'auto' }}>
                  <button className="btn" style={{ width: '100%' }}>
                    <ExternalLink size={17} /> Join Meeting
                  </button>
                </a>
              ) : (
                <button className="btn btn-secondary" disabled style={{ width: '100%', marginTop: 'auto', opacity: 0.6 }}>
                  No meeting link
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Lecture' : 'Schedule Lecture'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Course</label>
            <select value={course} onChange={e => setCourse(e.target.value)} required>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <label>Meeting link</label>
            <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">{editingId ? 'Save Changes' : 'Schedule'}</button>
          </div>
        </form>
      </Modal>
      {confirmEl}
    </div>
  );
};

export default Lectures;
