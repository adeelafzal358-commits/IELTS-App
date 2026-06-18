import { useState, useEffect } from "react";
import API from "../services/api";

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await API.get("/results");
      setResults(res.data.data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2>📊 Results</h2>
      </div>

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Student</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Test</th>
            <th style={styles.th}>Score</th>
            <th style={styles.th}>Band</th>
            <th style={styles.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r._id} style={styles.row}>
              <td style={styles.td}>{r.userId?.name || "-"}</td>
              <td style={styles.td}>{r.userId?.email || "-"}</td>
              <td style={styles.td}>{r.testId?.title || "-"}</td>
              <td style={styles.td}>{r.score}/{r.total}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.band,
                  backgroundColor: r.band >= 7 ? "#2ecc71" : r.band >= 5 ? "#f39c12" : "#e74c3c"
                }}>
                  Band {r.band}
                </span>
              </td>
              <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  thead: { backgroundColor: "#1a1a2e", color: "white" },
  th: { padding: "12px 15px", textAlign: "left" },
  td: { padding: "12px 15px" },
  row: { borderBottom: "1px solid #eee" },
  band: { padding: "4px 10px", borderRadius: "20px", color: "white", fontWeight: "bold", fontSize: "12px" },
};