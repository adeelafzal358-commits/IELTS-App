import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Tests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Is form state mein Writing Task 1 aur Task 2 ki fields add kar di hain
  const [form, setForm] = useState({
    title: "",
    description: "",
    level: "Beginner",
    duration: 60,
    task1Prompt: "",
    task1ImageUrl: "",
    task2Prompt: ""
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
    if (!form.title) {
      alert("Test title is required");
      return;
    }
    try {
      // Backend ko asali IELTS format ke mutabik data bhej rahe hain
      const payload = {
        title: form.title,
        description: form.description,
        level: form.level,
        duration: form.duration,
        writing: {
          task1: {
            taskType: "line_graph",
            prompt: form.task1Prompt,
            imageUrl: form.task1ImageUrl,
            minWords: 150
          },
          task2: {
            taskType: "discussion_essay",
            prompt: form.task2Prompt,
            minWords: 250
          }
        }
      };

      await API.post("/tests", payload);
      setShowForm(false);
      
      // Form ko wapas reset kar rahe hain
      setForm({ 
        title: "", 
        description: "", 
        level: "Beginner", 
        duration: 60,
        task1Prompt: "",
        task1ImageUrl: "",
        task2Prompt: ""
      });
      fetchTests();
      alert("Test with Writing Section created successfully!");
    } catch (err) {
      console.log(err);
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
          <h3>Create New Test</h3>
          
          {/* Basic Info Grid */}
          <div style={styles.grid}>
            <input
              style={styles.input}
              placeholder="Test Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select
              style={styles.input}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <input
              style={styles.input}
              type="number"
              placeholder="Duration (minutes)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>

          {/* New Writing Fields Section */}
          <div style={styles.writingSection}>
            <h4 style={{ margin: "10px 0" }}>✍️ Writing Task 1 Configuration</h4>
            <textarea
              style={styles.textarea}
              rows="3"
              placeholder="Enter Writing Task 1 prompt here..."
              value={form.task1Prompt}
              onChange={(e) => setForm({ ...form, task1Prompt: e.target.value })}
            />
            <input
              style={styles.inputFull}
              placeholder="Graph/Chart Image URL (Optional)"
              value={form.task1ImageUrl}
              onChange={(e) => setForm({ ...form, task1ImageUrl: e.target.value })}
            />

            <h4 style={{ margin: "15px 0 10px 0" }}>✍️ Writing Task 2 Configuration</h4>
            <textarea
              style={styles.textarea}
              rows="4"
              placeholder="Enter Writing Task 2 essay prompt here..."
              value={form.task2Prompt}
              onChange={(e) => setForm({ ...form, task2Prompt: e.target.value })}
            />
          </div>

          <p style={styles.hint}>
            Yeh data submit karne se naye test ke andar automatic Writing fields attach ho jayengi.
          </p>
          <button style={styles.saveBtn} onClick={handleSubmit}>
            Save Test
          </button>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Title</th>
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
              <td style={styles.td}>{t.level}</td>
              <td style={styles.td}>{t.duration} min</td>
              <td style={styles.td}>{t.questions?.length || 0}</td>
              <td style={styles.td}>
                <button
                  style={styles.manageBtn}
                  onClick={() => navigate(`/tests/${t._id}/questions`)}
                >
                  Manage Questions
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(t._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  addBtn: { padding: "10px 15px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  saveBtn: { padding: "12px 20px", backgroundColor: "green", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "15px", width: "100%" },
  form: { backgroundColor: "white", padding: "20px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #ddd" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd" },
  inputFull: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", width: "100%", boxSizing: "border-box", marginTop: "5px" },
  textarea: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  writingSection: { marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px" },
  hint: { fontSize: "13px", color: "#666", marginTop: "10px" },
  table: { width: "100%", backgroundColor: "white", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1a1a2e", color: "white" },
  th: { padding: "10px" },
  td: { padding: "10px" },
  row: { borderBottom: "1px solid #eee" },
  manageBtn: { padding: "6px 10px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "8px" },
  deleteBtn: { padding: "6px 10px", backgroundColor: "red", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
};
{/* Yeh button aapki Tests.jsx ke table ke andar lagayenge */}
<button
  style={{
    padding: "6px 10px",
    backgroundColor: "#2ecc71", // Green color
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "8px"
  }}
  onClick={() => navigate(`/exam/${t._id}/writing`)} // Yeh student ko seedha exam screen par le jayega
>
  Take Exam
</button>
