import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

const friendlyError = (err: unknown) => {
  const msg = err instanceof Error ? err.message : 'Something went wrong.';
  if (msg.includes('invalid-credential') || msg.includes('wrong-password')) return 'Wrong email or password. Please try again.';
  if (msg.includes('user-not-found')) return 'No account found with that email.';
  if (msg.includes('email-already-in-use')) return 'An account already exists with that email.';
  if (msg.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (msg.includes('too-many-requests')) return 'Too many attempts. Wait a moment and try again.';
  if (msg.includes('network-request-failed')) return 'Network error. Check your connection.';
  return msg;
};

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [goWelcome, setGoWelcome] = useState(false);
  const { login, register, currentUser } = useAuth();
  const navigate = useNavigate();
  const hasSubmitted = useRef(false);

  // If someone lands on the login page while already signed in, skip past it.
  // The ref stops this from fighting the post-login redirect to /welcome.
  useEffect(() => {
    if (currentUser && !hasSubmitted.current) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  // After a fresh login/register, wait until the user is in context, then
  // head to the welcome screen (avoids a bounce back to /login).
  useEffect(() => {
    if (currentUser && goWelcome) navigate('/welcome', { replace: true });
  }, [currentUser, goWelcome, navigate]);

  const switchMode = (next: 'login' | 'signup') => {
    setError('');
    setPassword('');
    setMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      hasSubmitted.current = true;
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, 'student');
      }
      setGoWelcome(true);
    } catch (err) {
      hasSubmitted.current = false;
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container center">
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BookOpen size={48} color="var(--primary-color)" />
          <h2 style={{ marginTop: '1rem' }}>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
          <p className="muted">
            {mode === 'login' ? 'Sign in to your EduSMS account' : 'Join as a student and get started'}
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '0.95rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="input-group">
              <label>Full name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem' }}>
          {mode === 'login' ? (
            <>New here? <a href="#" onClick={e => { e.preventDefault(); switchMode('signup'); }}>Create a student account</a></>
          ) : (
            <>Already have an account? <a href="#" onClick={e => { e.preventDefault(); switchMode('login'); }}>Sign in</a></>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
