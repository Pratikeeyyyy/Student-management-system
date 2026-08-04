import type { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'teacher' | 'student';

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
}

export interface Course {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  enrolled: string[];
}

export interface Grade {
  id: string;
  courseId: string;
  studentId: string;
  assessment: string;
  score: number;
  timestamp: Timestamp;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  dueDate: string;
}

export interface Lecture {
  id: string;
  topic: string;
  course: string;
  date: string;
  time: string;
  meetingLink: string;
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string;
  records: Record<string, string>;
  timestamp: Timestamp;
}

export interface AppUser {
  id: string;
  name?: string;
  email?: string;
  role: Role;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';
