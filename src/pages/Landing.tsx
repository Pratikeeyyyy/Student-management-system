import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpen,
  Users,
  BookMarked,
  CheckSquare,
  Award,
  FileText,
  Video,
  Calendar,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Student records",
    text: "Keep every student, grade and contact in one tidy roster.",
  },
  {
    icon: BookMarked,
    title: "Courses & enrollment",
    text: "Build courses, set schedules and enroll students in a couple of clicks.",
  },
  {
    icon: CheckSquare,
    title: "Attendance",
    text: "Mark present, absent or late, per course and per day.",
  },
  {
    icon: Award,
    title: "Grades",
    text: "Record scores per assessment and watch the averages add up.",
  },
  {
    icon: FileText,
    title: "Assignments",
    text: "Post homework with due dates; students tick it off when done.",
  },
  {
    icon: Video,
    title: "Lectures",
    text: "Schedule online sessions with meeting links attached.",
  },
  {
    icon: Calendar,
    title: "Timetable",
    text: "A weekly view that builds itself from course schedules.",
  },
];

const Landing: React.FC = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-logo">
          <BookOpen size={26} color="var(--primary-color)" />
          <span>Learning with Pratik</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/login">
            <button className="btn btn-secondary">Sign in</button>
          </Link>
          <Link to="/login?mode=signup">
            <button className="btn">Get started</button>
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <h1>Student management.</h1>
        <p className="muted">
          Learning with Pratik keeps your students, courses, attendance, grades
          and assignments in one clean place — for teachers, admins and students
          alike.
        </p>
        <div className="landing-cta">
          <Link to="/login?mode=signup">
            <button className="btn">
              Create an account <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/login">
            <button className="btn btn-secondary">Sign in</button>
          </Link>
        </div>
      </section>

      <section className="landing-features">
        {features.map((f) => (
          <div key={f.title} className="card">
            <f.icon size={26} color="var(--primary-color)" />
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer muted">
        © {new Date().getFullYear()} EduSMS
      </footer>
    </div>
  );
};

export default Landing;
