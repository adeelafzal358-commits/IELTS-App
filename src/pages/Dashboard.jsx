import { useState, useEffect } from "react";
import API from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    candidates: 0,
    tests: 0,
    results: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [candidates, tests, results] = await Promise.all([
        API.get("/candidates"),
        API.get("/tests"),
        API.get("/results")
      ]);
      setStats({
        candidates: candidates.data.data.length,
        tests: tests.data.data.length,
        results: results.data.data.length
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Dashboard 📊</h2>
      <div style={styles.cards}>
        <div style={{ ...styles.card, backgroundColor: "#3498db" }}>
          <h3>👥 Candidates</h3>
          <h1>{stats.candidates}</h1>
        </div>
        <div style={{ ...styles.card, backgroundColor: "#2ecc71" }}>
          <h3>📝 Tests</h3>
          <h1>{stats.tests}</h1>
        </div>
        <div style={{ ...styles.card, backgroundColor: "#e74c3c" }}>
          <h3>📊 Results</h3>
          <h1>{stats.results}</h1>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px"
  },
  cards: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap"
  },
  card: {
    color: "white",
    padding: "30px",
    borderRadius: "10px",
    minWidth: "200px",
    textAlign: "center"
  }
};