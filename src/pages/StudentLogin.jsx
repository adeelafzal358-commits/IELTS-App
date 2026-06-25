import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "https://ielts-backend.bonto.run/api";

export default function StudentLogin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Email aur password required hai");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/student/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("studentToken", res.data.token);
      localStorage.setItem("studentUser", JSON.stringify(res.data.user));
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Sab fields required hain");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/student/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("studentToken", res.data.token);
      localStorage.setItem("studentUser", JSON.stringify(res.data.user));
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / Title */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>📝</div>
          <h1 style={styles.title}>PrimeMock IELTS</h1>
          <p style={styles.subtitle}>Student Portal</p>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={tab === "login" ? styles.activeTab : styles.inactiveTab}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Login
          </button>
          <button
            style={tab === "register" ? styles.activeTab : styles.inactiveTab}
            onClick={() => { setTab("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div style={styles.form}>
          {tab === "register" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                name="name"
                placeholder="Apna naam likhein"
                value={form.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error && <p style={styles.error}>⚠️ {error}</p>}

          <button
            style={loading ? styles.btnDisabled : styles.btn}
            onClick={tab === "login" ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? "Please wait..." : tab === "login" ? "Login" : "Create Account"}
          </button>
        </div>

        {/* Switch tab */}
        <p style={styles.switchText}>
          {tab === "login" ? "Account nahi hai? " : "Already registered? "}
          <span
            style={styles.switchLink}
            onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}
          >
            {tab === "login" ? "Register karein" : "Login karein"}
          </span>
        </p>

        {/* Admin link */}
        <p style={styles.adminLink}>
          Admin?{" "}
          <a href="/" style={styles.switchLink}>
            Admin Panel
          </a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0f4f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
  },
  logoArea: {
    textAlign: "center",
    marginBottom: "28px",
  },
  logoIcon: {
    fontSize: "48px",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#1a1a2e",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#888",
  },
  tabs: {
    display: "flex",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e0e0e0",
    marginBottom: "24px",
  },
  activeTab: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#1a1a2e",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  inactiveTab: {
    flex: 1,
    padding: "10px",
    backgroundColor: "white",
    color: "#666",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  error: {
    color: "#e74c3c",
    fontSize: "13px",
    margin: 0,
    backgroundColor: "#ffeaea",
    padding: "10px",
    borderRadius: "8px",
  },
  btn: {
    padding: "13px",
    backgroundColor: "#1a1a2e",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
  btnDisabled: {
    padding: "13px",
    backgroundColor: "#999",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "not-allowed",
    marginTop: "4px",
  },
  switchText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    marginTop: "20px",
  },
  switchLink: {
    color: "#3498db",
    cursor: "pointer",
    fontWeight: "600",
  },
  adminLink: {
    textAlign: "center",
    fontSize: "12px",
    color: "#aaa",
    marginTop: "8px",
  },
};