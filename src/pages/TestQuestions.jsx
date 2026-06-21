import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import ModuleTabs from "../components/questions/ModuleTabs";
import QuestionForm from "../components/questions/QuestionForm";

export default function TestQuestions() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState("reading");

  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const res = await API.get(`/tests/${testId}`);
      setTest(res.data.data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const openEditForm = (q) => {
    setEditingQuestion(q);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
  };

  const handleFormSuccess = () => {
    closeForm();
    fetchTest();
  };

  const handleDelete = async (questionId) => {
    const confirmed = window.confirm("Is question ko delete karna hai? Ye action wapis nahi ho sakta.");
    if (!confirmed) return;

    setDeletingId(questionId);
    try {
      await API.delete(`/tests/${testId}/questions/${questionId}`);
      fetchTest();
    } catch (err) {
      console.log(err);
      alert("Question delete nahi ho saka. Dobara try karein.");
    }
    setDeletingId(null);
  };

  if (loading) return <p>Loading...</p>;
  if (!test) return <p>Test not found</p>;

  const filteredQuestions = (test.questions || []).filter(
    (q) => q.module === activeModule
  );

  return (
    <div>
      <Link to="/tests" style={styles.backLink}>← Back to Tests</Link>

      <div style={styles.header}>
        <h2>{test.title}</h2>
        <p style={styles.subtitle}>{test.description}</p>
      </div>

      <ModuleTabs activeModule={activeModule} onChange={setActiveModule} />

      <div style={styles.listHeader}>
        <h3 style={{ textTransform: "capitalize" }}>{activeModule} Questions ({filteredQuestions.length})</h3>
        <button style={styles.addBtn} onClick={openAddForm}>
          + Add Question
        </button>
      </div>

      {filteredQuestions.length === 0 ? (
        <p style={styles.empty}>Is module me abhi koi question nahi hai.</p>
      ) : (
        <div style={styles.list}>
          {filteredQuestions.map((q, i) => (
            <div key={q._id} style={styles.qCard}>
              <div style={styles.qCardTop}>
                <strong>{i + 1}. {q.question}</strong>
                <div style={styles.qActions}>
                  <button style={styles.editBtn} onClick={() => openEditForm(q)}>
                    Edit
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(q._id)}
                    disabled={deletingId === q._id}
                  >
                    {deletingId === q._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
              <div style={styles.qMeta}>
                {q.questionType} · {q.marks} mark{q.marks > 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <QuestionForm
          testId={testId}
          module={activeModule}
          questionToEdit={editingQuestion}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}

const styles = {
  backLink: { display: "inline-block", marginBottom: "15px", color: "#3498db", textDecoration: "none", fontSize: "14px" },
  header: { marginBottom: "10px" },
  subtitle: { color: "#666", margin: "5px 0 0" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 15px" },
  addBtn: { padding: "10px 15px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  empty: { color: "#888", fontStyle: "italic" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  qCard: { backgroundColor: "white", padding: "15px", borderRadius: "8px", border: "1px solid #eee" },
  qCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" },
  qActions: { display: "flex", gap: "8px", flexShrink: 0 },
  editBtn: { padding: "5px 10px", fontSize: "12px", border: "1px solid #2563eb", background: "#fff", color: "#2563eb", borderRadius: "5px", cursor: "pointer" },
  deleteBtn: { padding: "5px 10px", fontSize: "12px", border: "1px solid #dc2626", background: "#fff", color: "#dc2626", borderRadius: "5px", cursor: "pointer" },
  qMeta: { fontSize: "12px", color: "#888", marginTop: "5px", textTransform: "capitalize" },
};