# EduSMS — Student Management System

A simple student management dashboard for schools: students, courses, enrollments,
attendance, grades, assignments, lectures and a timetable. Data lives in
Firebase (Auth + Firestore), so everything is shared across sessions in real time.

Built with React + TypeScript + Vite.

## Features

- **Role-based access** — admin, teacher and student views
- **Students** — add, edit, delete and search student records
- **Courses** — manage courses and enroll students per course
- **Attendance** — mark present / absent / late, saved per course and date
- **Grades** — record and edit assessment scores per course
- **Assignments** — teachers create them, students mark them done
- **Lectures** — schedule online lectures with meeting links
- **Timetable** — auto-built from each course's schedule
- **User management** — admins can change account roles
- **Self sign-up** — students can create their own accounts from the login page

## Getting started

```bash
npm install
npm run dev
```

Firebase config is already wired up in `src/firebase.ts`. The app expects the
following Firestore collections (empty collections are fine, the app will
create documents as you go):

| Collection            | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `users`               | auth account metadata (`name`, `email`, `role`)  |
| `students`            | student records (`name`, `email`, `grade`)       |
| `courses`             | courses (`name`, `teacher`, `schedule`, `enrolled`) |
| `attendance`          | daily attendance records per course              |
| `grades`              | assessment scores (`courseId`, `studentId`, ...) |
| `assignments`         | homework / tasks                                 |
| `assignment_submissions` | who marked each assignment done               |
| `lectures`            | scheduled online lectures                        |

### Firestore security rules

This repo ships without deployment rules, so for local development you'll
want Firestore rules that at least let authenticated users read and write
their own data. A starting point:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Tighten these up (e.g. restrict writes to admin/teacher roles) before any
real deployment.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint     # eslint
npm run preview  # preview the production build
```
