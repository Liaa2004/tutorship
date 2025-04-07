import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Class from "./components/Class";
import ClassCGPA from "./components/ClassCGPA";
import Students from "./components/Students";
import ScholarshipApplications from "./components/ScholarshipApplications";
import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import StudentDashboard from "./components/StudentDashboard";
import ActivityPoints from "./components/ActivityPoints";
import ActivitySubmission from "./components/ActivitySubmission";
import AllRequests from "./components/AllRequests"; 
import InternalsPage from "./components/InternalsPage";

import "./App.css";

const Requests = () => <div>Requests Page</div>;

function App() {
  const getInitialTheme = () => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) return storedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
        
        <main className="app-content">
          <div className="container">
            <Routes>
              {/* Tutor & Student Dashboards */}
              <Route path="/tutor/dashboard" element={<Dashboard />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />

              {/* Login */}
              <Route path="/" element={<LoginPage />} />

              {/* Class Routes */}
              <Route path="/class/:id" element={<Class />}>
                <Route path="requests" element={<Requests />} />
                <Route path="cgpa" element={<ClassCGPA />} />
                <Route path="students" element={<Students />} />
                <Route path="activityPoints" element={<ActivityPoints />} />
                <Route path="scholarship" element={<ScholarshipApplications />} />
                <Route path="internals" element={<InternalsPage />} />
              </Route>

              {/* Activity Submission Route */}
              <Route path="/submit-activity" element={<ActivitySubmission />} />
              <Route path="/all-requests" element={<AllRequests />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;