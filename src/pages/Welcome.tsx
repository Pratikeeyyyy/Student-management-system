import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

const Welcome: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [firstTime, setFirstTime] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    getDoc(doc(db, 'users', uid)).then(snap => {
      const data = snap.exists() ? snap.data() : {};
      const isNew = !data.lastLoginAt;
      setFirstTime(isNew);
      setReady(true);

      // Mark this visit so returning users get the "welcome back" greeting.
      updateDoc(doc(db, 'users', uid), { lastLoginAt: serverTimestamp() })
        .catch(err => console.error('Could not stamp lastLoginAt:', err));
    }).catch(err => {
      console.error('Could not load profile for welcome screen:', err);
      setReady(true);
    });
  }, [currentUser]);

  const firstName = (currentUser?.displayName || currentUser?.email || 'friend').split(' ')[0];

  return (
    <div className="app-container center">
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '560px', textAlign: 'center' }}>
        <BookOpen size={52} color="var(--primary-color)" style={{ marginBottom: '1.25rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
          {ready ? (firstTime ? 'Welcome to EduSMS' : `Welcome back, ${firstName}`) : 'One sec...'}
        </h2>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          {!ready
            ? 'Getting things ready.'
            : firstTime
              ? "You're all set. Head to the dashboard to add courses, enroll students and start the semester."
              : 'Good to see you again. Jump back in where you left off.'}
        </p>
        {ready && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn" onClick={() => navigate('/dashboard')}>
              Go to dashboard <ArrowRight size={18} />
            </button>
            <p className="muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={15} color="var(--success-color)" /> Your account is ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;
