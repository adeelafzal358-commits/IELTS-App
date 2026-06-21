import { useState, useEffect } from "react";
import API from "../services/api";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    candidate_name: "",
    email: "",
    phone: "",
    cnic: "",
    passport: "",
    test_type: "IELTS Academic",
    test_date: "",
    venue: ""
  });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await API.get("/candidates");
      setCandidates(res.data.data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.cnic.includes(search);
    const matchesType = filterType === "All" || c.test_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSubmit = async () => {
    try {
      await API.post("/candidates", form);
      setShowForm(false);
      setForm({ candidate_name: "", email: "", phone: "", cnic: "", passport: "", test_type: "IELTS Academic", test_date: "", venue: "" });
      fetchCandidates();
    } catch (err) {
      alert("Error creating candidate");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    try {
      await API.delete(`/candidates/${id}`);
      fetchCandidates();
    } catch (err) {
      alert("Error deleting candidate");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2>👥 Candidates</h2>
        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Candidate"}
        </button>
      </div>

      <div style={styles.searchBar}>
        <input
          style={styles.searchInput}
          placeholder="🔍 Search by name, email, or CNIC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="IELTS Academic">IELTS Academic</option>
          <option value="IELTS General Training">IELTS General Training</option>
        </select>
      </div>

      {showForm && (
        <div style={styles.form}>
          <h3>Add New Candidate</h3>
          <div style={styles.grid}>
            <input style={styles.input} placeholder="Full Name" value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} />
            <input style={styles.input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input style={styles.input} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input style={styles.input} placeholder="CNIC" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
            <input style={styles.input} placeholder="Passport" value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} />
            <select style={styles.input} value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })}>
              <option>IELTS Academic</option>
              <option>IELTS General Training</option>
            </select>
            <input style={styles.input} type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} />
            <input style={styles.input} placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </div>
          <button style={styles.addBtn} onClick={handleSubmit}>Save Candidate</button>
        </div>
      )}

      <p style={styles.count}>Showing {filteredCandidates.length} of {candidates.length} candidates</p>

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Test Type</th>
            <th>Test Date</th>
            <th>Venue</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCandidates.map((c) => (
            <tr key={c._id} style={styles.row}>
              <td>{c.candidate_name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{c.test_type}</td>
              <td>{c.test_date ? new Date(c.test_date).toLocaleDateString() : "-"}</td>
              <td>{c.venue}</td>
              <td>
                <button style={styles.deleteBtn} onClick={() => handleDelete(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredCandidates.length === 0 && (
        <p style={styles.noResults}>No candidates found matching your search.</p>
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  addBtn: { padding: "10px 20px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  searchBar: { display: "flex", gap: "10px", marginBottom: "20px" },
  searchInput: { flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" },
  filterSelect: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" },
  count: { color: "#666", fontSize: "14px", marginBottom: "10px" },
  form: { backgroundColor: "white", padding: "20px", borderRadius: "10px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  thead: { backgroundColor: "#1a1a2e", color: "white" },
  row: { borderBottom: "1px solid #eee" },
  deleteBtn: { padding: "6px 12px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
  noResults: { textAlign: "center", color: "#999", padding: "20px" },
};