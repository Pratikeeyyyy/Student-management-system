import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  BookMarked,
  CheckSquare,
  Award,
  FileText,
  Video,
  Calendar,
  ArrowRight,
  Sparkles,
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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Landing: React.FC = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <div className="blob blob-one" />
      <div className="blob blob-two" />
      <div className="blob blob-three" />

      <motion.header
        className="landing-nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="landing-logo">
          <GraduationCap size={28} />
          <span>Learning with Pratik</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/login">
            <button className="btn btn-secondary">Sign in</button>
          </Link>
          <Link to="/login?mode=signup">
            <button className="btn btn-primary-glow">Get started</button>
          </Link>
        </div>
      </motion.header>

      <motion.section
        className="landing-hero"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="landing-badge">
          <Sparkles size={16} /> Modern school management
        </motion.div>
        <motion.h1 variants={item}>
          Student management,
          <br />
          <span className="gradient-text">made delightful.</span>
        </motion.h1>
        <motion.p variants={item} className="muted">
          Learning with Pratik keeps your students, courses, attendance, grades
          and assignments in one clean place — for teachers, admins and students
          alike.
        </motion.p>
        <motion.div variants={item} className="landing-cta">
          <Link to="/login?mode=signup">
            <button className="btn btn-primary-glow">
              Create an account <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/login">
            <button className="btn btn-secondary">Sign in</button>
          </Link>
        </motion.div>
      </motion.section>

      <motion.section
        className="landing-features"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {features.map((f) => (
          <motion.div key={f.title} variants={item} className="card">
            <span className="feature-icon">
              <f.icon size={24} />
            </span>
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </motion.div>
        ))}
      </motion.section>

      <footer className="landing-footer muted">
        © {new Date().getFullYear()} Learning with Pratik
      </footer>
    </div>
  );
};

export default Landing;
