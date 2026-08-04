import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDEqROctdEicnoRf82sWtegJUa5oC2jjJw",
  authDomain: "edusms-32329.firebaseapp.com",
  projectId: "edusms-32329",
  storageBucket: "edusms-32329.firebasestorage.app",
  messagingSenderId: "281101774509",
  appId: "1:281101774509:web:2cd570937db9216e7ca024"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);