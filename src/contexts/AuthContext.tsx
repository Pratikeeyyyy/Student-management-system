import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, addDoc, updateDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Role } from '../types';

interface AuthContextValue {
  currentUser: User | null;
  userRole: Role | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole((userDoc.data().role as Role) ?? 'student');
          } else {
            setUserRole('student');
          }
        } catch (error) {
          console.error('Could not load the user role:', error);
          setUserRole('student');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: name.trim() });

    // First account in a fresh school becomes the admin so someone can log in
    // and manage things straight away. Later signups are just students.
    const admins = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    const finalRole = admins.empty ? 'admin' : role;

    await setDoc(doc(db, 'users', credential.user.uid), {
      name: name.trim(),
      email: email.trim(),
      role: finalRole,
    });

    // Link the new student account to a student record so teachers can grade them.
    if (finalRole === 'student') {
      const existing = await getDocs(query(collection(db, 'students'), where('email', '==', email.trim())));
      if (!existing.empty) {
        await updateDoc(doc(db, 'students', existing.docs[0].id), { uid: credential.user.uid });
      } else {
        await addDoc(collection(db, 'students'), {
          name: name.trim(),
          email: email.trim(),
          grade: '',
          uid: credential.user.uid,
        });
      }
    }
  };

  const logout = () => signOut(auth);

  const value = { currentUser, userRole, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
