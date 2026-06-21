import { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Tests from "./pages/Tests";
import TestQuestions from "./pages/TestQuestions";
import Results from "./pages/Results";

export default function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.logo}>Prime Mock IELTS — Admin Panel</h2>
        <div style={styles.userInfo}>
          <span>👤 {user.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <div style={styles.body}>
        <div style={styles.sidebar}>
          <Link to="/dashboard" style={isActive("/dashboard") ? styles.activeBtn : styles.sideBtn}>📊 Dashboard</Link>
          <Link to="/candidates" style={isActive("/candidates") ? styles.activeBtn : styles.sideBtn}>👥 Candidates</Link>
          <Link to="/tests" style={isActive("/tests") ? styles.activeBtn : styles.sideBtn}>📝 Tests</Link>
          <Link to="/results" style={isActive("/results") ? styles.activeBtn : styles.sideBtn}>📊 Results</Link>
        </div>
        <div style={styles.content}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/tests/:testId/questions" element={<TestQuestions />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5" },
  header: { backgroundColor: "#1a1a2e", color: "white", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { margin: 0, fontSize: "18px" },
  userInfo: { display: "flex", alignItems: "center", gap: "15px" },
  logoutBtn: { padding: "8px 16px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  body: { display: "flex", minHeight: "calc(100vh - 60px)" },
  sidebar: { width: "200px", backgroundColor: "#2c3e50", padding: "20px 0", display: "flex", flexDirection: "column", gap: "5px" },
  sideBtn: { padding: "12px 20px", backgroundColor: "transparent", color: "white", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", textDecoration: "none", display: "block" },
  activeBtn: { padding: "12px 20px", backgroundColor: "#1a1a2e", color: "white", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", borderLeft: "4px solid #3498db", textDecoration: "none", display: "block" },
  content: { flex: 1, padding: "20px" },
};