import { useState, useEffect } from "react";
import API from "../services/api";

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    level: "Beginner",
    duration: 60
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await API.get("/tests");
      setTests(res.data.data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      await API.post("/tests", form);
      setShowForm(false);
      setForm({ title: "", description: "", level: "Beginner", duration: 60 });
      fetchTests();
    } catch (err) {
      alert("Error creating test");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await API.delete(`/tests/${id}`);
      fetchTests();
    } catch (err) {
      alert("Error deleting test");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2>📝 Tests</h2>
        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Test"}
        </button>
      </div>

      {showForm && (
        <div style={styles.form}>
          <h3>Add New Test</h3>
          <div style={styles.grid}>
            <input style={styles.input} placeholder="Test Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input style={styles.input} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select style={styles.input} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <input style={styles.input} type="number" placeholder="Duration (minutes)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <button style={styles.addBtn} onClick={handleSubmit}>Save Test</button>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Level</th>
            <th style={styles.th}>Duration</th>
            <th style={styles.th}>Questions</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t) => (
            <tr key={t._id} style={styles.row}>
              <td style={styles.td}>{t.title}</td>
              <td style={styles.td}>{t.description}</td>
              <td style={styles.td}>{t.level}</td>
              <td style={styles.td}>{t.duration} min</td>
              <td style={styles.td}>{t.questions.length}</td>
              <td style={styles.td}>
                <button style={styles.deleteBtn} onClick={() => handleDelete(t._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  addBtn: { padding: "10px 20px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  form: { backgroundColor: "white", padding: "20px", borderRadius: "10px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  thead: { backgroundColor: "#1a1a2e", color: "white" },
  th: { padding: "12px 15px", textAlign: "left" },
  td: { padding: "12px 15px" },
  row: { borderBottom: "1px solid #eee" },
  deleteBtn: { padding: "6px 12px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
};