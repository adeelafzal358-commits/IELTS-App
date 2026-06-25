import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "https://ielts-backend.bonto.run/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("tests"); // "tests" | "results"

  const studentUser = JSON.parse(localStorage.getItem("studentUser") || "{}");
  const token = localStorage.getItem("studentToken");

  useEffect(() => {
    if (!token) {
      navigate("/student/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [testsRes, attemptsRes] = await Promise.all([
        axios.get(`${API}/tests`, { headers }),
        axios.get(`${API}/attempts/my`, { headers }),
      ]);
      setTests(testsRes.data.data || []);
      setAttempts(attemptsRes.data.attempts || []);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentUser");
    navigate("/student/login");
  };

  const handleStartTest = (testId) => {
    navigate(`/attempt/${testId}`);
  };

  const getAttemptForTest = (testId) => {
    return attempts.find((a) => a.testId?._id === testId || a.testId === testId);
  };

  const getBandColor = (band) => {
    if (!band) return "#999";
    if (band >= 7) return "#27ae60";
    if (band >= 5) return "#f39c12";
    return "#e74c3c";
  };

  const getStatusBadge = (status) => {
    const map = {
      in_progress: { label: "In Progress", color: "#f39c12", bg: "#fff8e1" },
      submitted: { label: "Pending Score", color: "#8e44ad", bg: "#f3e5f5" },
      scored: { label: "Scored", color: "#27ae60", bg: "#e8f5e9" },
    };
    return map[status] || { label: status, color: "#666", bg: "#f5f5f5" };
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logoIcon}>📝</span>
          <div>
            <h2 style={styles.logoText}>PrimeMock IELTS</h2>
            <p style={styles.portalText}>Student Portal</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>👤 {studentUser.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Welcome Card */}
        <div style={styles.welcomeCard}>
          <div>
            <h3 style={styles.welcomeTitle}>Welcome back, {studentUser.name}! 👋</h3>
            <p style={styles.welcomeSub}>
              {attempts.length > 0
                ? `Tumne ${attempts.length} test attempt kiye hain`
                : "Apna pehla IELTS practice test start karo!"}
            </p>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{tests.length}</span>
              <span style={styles.statLabel}>Tests Available</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{attempts.filter((a) => a.status === "scored").length}</span>
              <span style={styles.statLabel}>Completed</span>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statNum, color: "#3498db" }}>
                {attempts.find((a) => a.overallBand)?.overallBand || "—"}
              </span>
              <span style={styles.statLabel}>Best Band</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={tab === "tests" ? styles.activeTab : styles.inactiveTab}
            onClick={() => setTab("tests")}
          >
            📝 Available Tests
          </button>
          <button
            style={tab === "results" ? styles.activeTab : styles.inactiveTab}
            onClick={() => setTab("results")}
          >
            📊 My Results
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : tab === "tests" ? (
          <div style={styles.grid}>
            {tests.length === 0 ? (
              <p style={styles.empty}>Koi test available nahi hai abhi</p>
            ) : (
              tests.map((test) => {
                const attempt = getAttemptForTest(test._id);
                const badge = attempt ? getStatusBadge(attempt.status) : null;
                return (
                  <div key={test._id} style={styles.testCard}>
                    <div style={styles.testTop}>
                      <h4 style={styles.testTitle}>{test.title}</h4>
                      {badge && (
                        <span style={{ ...styles.badge, color: badge.color, backgroundColor: badge.bg }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p style={styles.testDesc}>{test.description || "IELTS Practice Test"}</p>
                    <div style={styles.testMeta}>
                      <span style={styles.metaItem}>⏱ {test.duration} min</span>
                      <span style={styles.metaItem}>📚 {test.level}</span>
                      <span style={styles.metaItem}>❓ {test.questions?.length || 0} questions</span>
                    </div>
                    {attempt?.status === "scored" && (
                      <div style={styles.bandRow}>
                        <span style={styles.bandLabel}>Overall Band:</span>
                        <span style={{ ...styles.bandScore, color: getBandColor(attempt.overallBand) }}>
                          {attempt.overallBand || "—"}
                        </span>
                      </div>
                    )}
                    <div style={styles.btnRow}>
                      {!attempt ? (
                        <button style={styles.startBtn} onClick={() => handleStartTest(test._id)}>
                          Start Test →
                        </button>
                      ) : attempt.status === "in_progress" ? (
                        <button style={styles.resumeBtn} onClick={() => handleStartTest(test._id)}>
                          Resume Test →
                        </button>
                      ) : (
                        <button
                          style={styles.resultBtn}
                          onClick={() => navigate(`/my-results/${attempt._id}`)}
                        >
                          View Result →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Results Tab
          <div style={styles.resultsList}>
            {attempts.length === 0 ? (
              <p style={styles.empty}>Abhi tak koi attempt nahi kiya</p>
            ) : (
              attempts.map((attempt) => {
                const badge = getStatusBadge(attempt.status);
                return (
                  <div key={attempt._id} style={styles.resultCard}>
                    <div style={styles.resultLeft}>
                      <h4 style={styles.resultTitle}>{attempt.testId?.title || "IELTS Test"}</h4>
                      <p style={styles.resultDate}>
                        {new Date(attempt.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>
                    <div style={styles.resultRight}>
                      <span style={{ ...styles.badge, color: badge.color, backgroundColor: badge.bg }}>
                        {badge.label}
                      </span>
                      {attempt.status === "scored" && (
                        <span style={{ ...styles.bandScore, color: getBandColor(attempt.overallBand) }}>
                          Band {attempt.overallBand || "—"}
                        </span>
                      )}
                      {attempt.status === "scored" && (
                        <button
                          style={styles.viewBtn}
                          onClick={() => navigate(`/my-results/${attempt._id}`)}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f0f4f8" },
  header: { backgroundColor: "#1a1a2e", color: "white", padding: "14px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: { fontSize: "28px" },
  logoText: { margin: 0, fontSize: "17px", fontWeight: "700" },
  portalText: { margin: 0, fontSize: "11px", color: "#aaa" },
  headerRight: { display: "flex", alignItems: "center", gap: "14px" },
  userName: { fontSize: "14px", color: "#ddd" },
  logoutBtn: { padding: "7px 14px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  body: { maxWidth: "900px", margin: "0 auto", padding: "24px 20px" },
  welcomeCard: { backgroundColor: "#1a1a2e", color: "white", borderRadius: "14px", padding: "24px 28px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" },
  welcomeTitle: { margin: "0 0 6px", fontSize: "18px", fontWeight: "700" },
  welcomeSub: { margin: 0, fontSize: "13px", color: "#aaa" },
  statsRow: { display: "flex", gap: "20px" },
  statBox: { textAlign: "center" },
  statNum: { display: "block", fontSize: "26px", fontWeight: "700", color: "#3498db" },
  statLabel: { fontSize: "11px", color: "#aaa" },
  tabs: { display: "flex", gap: "0", borderRadius: "10px", overflow: "hidden", border: "1px solid #e0e0e0", marginBottom: "20px", backgroundColor: "white" },
  activeTab: { flex: 1, padding: "11px", backgroundColor: "#1a1a2e", color: "white", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  inactiveTab: { flex: 1, padding: "11px", backgroundColor: "white", color: "#666", border: "none", cursor: "pointer", fontSize: "14px" },
  loading: { textAlign: "center", padding: "40px", color: "#888" },
  empty: { textAlign: "center", padding: "40px", color: "#888", backgroundColor: "white", borderRadius: "12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" },
  testCard: { backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  testTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" },
  testTitle: { margin: 0, fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
  testDesc: { fontSize: "13px", color: "#888", margin: "0 0 12px" },
  testMeta: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" },
  metaItem: { fontSize: "12px", color: "#666", backgroundColor: "#f5f5f5", padding: "4px 8px", borderRadius: "6px" },
  badge: { fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px" },
  bandRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
  bandLabel: { fontSize: "13px", color: "#666" },
  bandScore: { fontSize: "20px", fontWeight: "700" },
  btnRow: { display: "flex", justifyContent: "flex-end" },
  startBtn: { padding: "9px 18px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  resumeBtn: { padding: "9px 18px", backgroundColor: "#f39c12", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  resultBtn: { padding: "9px 18px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  resultsList: { display: "flex", flexDirection: "column", gap: "12px" },
  resultCard: { backgroundColor: "white", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  resultLeft: {},
  resultTitle: { margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "#1a1a2e" },
  resultDate: { margin: 0, fontSize: "12px", color: "#999" },
  resultRight: { display: "flex", alignItems: "center", gap: "12px" },
  viewBtn: { padding: "6px 14px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
};