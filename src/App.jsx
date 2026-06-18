import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Tests from "./pages/Tests";
import Results from "./pages/Results";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

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
          <button style={page === "dashboard" ? styles.activeBtn : styles.sideBtn} onClick={() => setPage("dashboard")}>📊 Dashboard</button>
          <button style={page === "candidates" ? styles.activeBtn : styles.sideBtn} onClick={() => setPage("candidates")}>👥 Candidates</button>
          <button style={page === "tests" ? styles.activeBtn : styles.sideBtn} onClick={() => setPage("tests")}>📝 Tests</button>
          <button style={page === "results" ? styles.activeBtn : styles.sideBtn} onClick={() => setPage("results")}>📊 Results</button>
        </div>
        <div style={styles.content}>
          {page === "dashboard" && <Dashboard />}
          {page === "candidates" && <Candidates />}
          {page === "tests" && <Tests />}
          {page === "results" && <Results />}
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
  sideBtn: { padding: "12px 20px", backgroundColor: "transparent", color: "white", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px" },
  activeBtn: { padding: "12px 20px", backgroundColor: "#1a1a2e", color: "white", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", borderLeft: "4px solid #3498db" },
  content: { flex: 1, padding: "20px" },
};