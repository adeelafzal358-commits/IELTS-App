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

  // Flat questions (writing/speaking/listening old style)
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Section states
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ passageTitle: "", passage: "", audioUrl: "" });
  const [savingSection, setSavingSection] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);

  useEffect(() => { fetchTest(); }, [testId]);

  const fetchTest = async () => {
    try {
      const res = await API.get(`/tests/${testId}`);
      setTest(res.data.data);
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  // ── Flat question handlers ──
  const openAddForm = () => { setEditingQuestion(null); setShowForm(true); };
  const openEditForm = (q) => { setEditingQuestion(q); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingQuestion(null); };
  const handleFormSuccess = () => { closeForm(); fetchTest(); };

  const handleDelete = async (questionId) => {
    if (!window.confirm("Is question ko delete karna hai?")) return;
    setDeletingId(questionId);
    try {
      await API.delete(`/tests/${testId}/questions/${questionId}`);
      fetchTest();
    } catch (err) { alert("Delete nahi ho saka."); }
    setDeletingId(null);
  };

  // ── Section handlers ──
  const openAddSection = () => {
    setEditingSection(null);
    setSectionForm({ passageTitle: "", passage: "", audioUrl: "" });
    setShowSectionForm(true);
  };

  const openEditSection = (sec) => {
    setEditingSection(sec);
    setSectionForm({ passageTitle: sec.passageTitle || "", passage: sec.passage || "", audioUrl: sec.audioUrl || "" });
    setShowSectionForm(true);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.passage.trim()) { alert("Passage likhna zaroori hai."); return; }
    setSavingSection(true);
    try {
      if (editingSection) {
        await API.put(`/tests/${testId}/sections/${editingSection._id}`, sectionForm);
      } else {
        await API.post(`/tests/${testId}/sections`, sectionForm);
      }
      setShowSectionForm(false);
      setEditingSection(null);
      fetchTest();
    } catch (err) { alert("Section save nahi ho saka."); }
    setSavingSection(false);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Yeh section aur iske saare questions delete ho jayenge. Confirm?")) return;
    try {
      await API.delete(`/tests/${testId}/sections/${sectionId}`);
      if (activeSectionId === sectionId) setActiveSectionId(null);
      fetchTest();
    } catch (err) { alert("Section delete nahi ho saka."); }
  };

  // ── Section Question handlers ──
  const handleDeleteSectionQuestion = async (sectionId, questionId) => {
    if (!window.confirm("Is question ko delete karna hai?")) return;
    setDeletingId(questionId);
    try {
      await API.delete(`/tests/${testId}/sections/${sectionId}/questions/${questionId}`);
      fetchTest();
    } catch (err) { alert("Delete nahi ho saka."); }
    setDeletingId(null);
  };

  if (loading) return <p>Loading...</p>;
  if (!test) return <p>Test not found</p>;

  const filteredQuestions = (test.questions || []).filter((q) => q.module === activeModule);
  const sections = (test.sections || []).filter((s) => {
    // Reading sections only for now; listening sections bhi yahan aa sakte hain baad mein
    return true;
  });

  const isReadingOrListening = activeModule === "reading" || activeModule === "listening";

  return (
    <div style={styles.page}>
      <Link to="/tests" style={styles.backLink}>← Back to Tests</Link>

      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>{test.title}</h2>
        <p style={styles.subtitle}>{test.description}</p>
      </div>

      <ModuleTabs activeModule={activeModule} onChange={setActiveModule} />

      {/* ── READING / LISTENING — Sections UI ── */}
      {isReadingOrListening ? (
        <div style={styles.sectionsContainer}>
          <div style={styles.listHeader}>
            <h3 style={{ margin: 0, textTransform: "capitalize" }}>
              {activeModule} Sections ({sections.length})
            </h3>
            <button style={styles.addBtn} onClick={openAddSection}>
              + Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <p style={styles.empty}>Abhi koi section nahi hai. "Add Section" se shuru karein.</p>
          ) : (
            sections.map((sec, sIdx) => (
              <div key={sec._id} style={styles.sectionCard}>
                {/* Section Header */}
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionTitleRow}>
                    <span style={styles.sectionBadge}>Section {sIdx + 1}</span>
                    <span style={styles.sectionTitle}>
                      {sec.passageTitle || "Untitled Passage"}
                    </span>
                  </div>
                  <div style={styles.sectionActions}>
                    <button style={styles.editBtn} onClick={() => openEditSection(sec)}>Edit Passage</button>
                    <button style={styles.deleteBtn} onClick={() => handleDeleteSection(sec._id)}>Delete</button>
                    <button
                      style={activeSectionId === sec._id ? styles.collapseBtn : styles.expandBtn}
                      onClick={() => setActiveSectionId(activeSectionId === sec._id ? null : sec._id)}
                    >
                      {activeSectionId === sec._id ? "▲ Hide" : "▼ Show"} Questions ({sec.questions?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Passage Preview */}
                <div style={styles.passagePreview}>
                  {(sec.passage || "").substring(0, 200)}{sec.passage?.length > 200 ? "..." : ""}
                </div>

                {/* Questions inside section */}
                {activeSectionId === sec._id && (
                  <div style={styles.sectionQuestions}>
                    <div style={styles.sqHeader}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>
                        Questions ({sec.questions?.length || 0})
                      </span>
                      <button
                        style={styles.addSmallBtn}
                        onClick={() => {
                          setEditingQuestion({ _sectionId: sec._id });
                          setShowForm(true);
                        }}
                      >
                        + Add Question
                      </button>
                    </div>

                    {(sec.questions || []).length === 0 ? (
                      <p style={styles.emptySmall}>Koi question nahi. Add karo.</p>
                    ) : (
                      (sec.questions || []).map((q, qIdx) => (
                        <div key={q._id} style={styles.sqCard}>
                          <div style={styles.sqTop}>
                            <span style={styles.qNum}>Q{qIdx + 1}</span>
                            <span style={styles.sqText}>{q.question}</span>
                            <div style={styles.qActions}>
                              <button style={styles.editBtn} onClick={() => {
                                setEditingQuestion({ ...q, _sectionId: sec._id });
                                setShowForm(true);
                              }}>Edit</button>
                              <button
                                style={styles.deleteBtn}
                                onClick={() => handleDeleteSectionQuestion(sec._id, q._id)}
                                disabled={deletingId === q._id}
                              >
                                {deletingId === q._id ? "..." : "Delete"}
                              </button>
                            </div>
                          </div>
                          <div style={styles.qMeta}>{q.questionType} · {q.marks} mark</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── WRITING / SPEAKING — Old flat UI ── */
        <div>
          <div style={styles.listHeader}>
            <h3 style={{ textTransform: "capitalize", margin: 0 }}>
              {activeModule} Questions ({filteredQuestions.length})
            </h3>
            <button style={styles.addBtn} onClick={openAddForm}>+ Add Question</button>
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
                      <button style={styles.editBtn} onClick={() => openEditForm(q)}>Edit</button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(q._id)}
                        disabled={deletingId === q._id}
                      >
                        {deletingId === q._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                  <div style={styles.qMeta}>{q.questionType} · {q.marks} mark{q.marks > 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Section Form Modal ── */}
      {showSectionForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingSection ? "Edit Section" : "New Section"}
            </h3>

            <label style={styles.label}>Passage Title</label>
            <input
              style={styles.input}
              placeholder="e.g. The History of Aviation"
              value={sectionForm.passageTitle}
              onChange={(e) => setSectionForm({ ...sectionForm, passageTitle: e.target.value })}
            />

            <label style={styles.label}>Passage Text *</label>
            <textarea
              style={styles.textarea}
              placeholder="Yahan poora passage likhein..."
              rows={10}
              value={sectionForm.passage}
              onChange={(e) => setSectionForm({ ...sectionForm, passage: e.target.value })}
            />

            {activeModule === "listening" && (
              <>
                <label style={styles.label}>Audio URL</label>
                <input
                  style={styles.input}
                  placeholder="https://..."
                  value={sectionForm.audioUrl}
                  onChange={(e) => setSectionForm({ ...sectionForm, audioUrl: e.target.value })}
                />
              </>
            )}

            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowSectionForm(false)}>Cancel</button>
              <button
                style={savingSection ? styles.saveBtnDisabled : styles.saveBtn}
                onClick={handleSaveSection}
                disabled={savingSection}
              >
                {savingSection ? "Saving..." : "Save Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question Form Modal ── */}
      {showForm && (
        <QuestionForm
          testId={testId}
          module={activeModule}
          questionToEdit={editingQuestion}
          sectionId={editingQuestion?._sectionId || null}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}

const styles = {
  page: { padding: "0 0 40px" },
  backLink: { display: "inline-block", marginBottom: "15px", color: "#3498db", textDecoration: "none", fontSize: "14px" },
  header: { marginBottom: "10px" },
  subtitle: { color: "#666", margin: "5px 0 0" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 15px" },
  addBtn: { padding: "10px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  empty: { color: "#888", fontStyle: "italic" },
  emptySmall: { color: "#aaa", fontSize: "13px", fontStyle: "italic", padding: "10px 0" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  qCard: { backgroundColor: "white", padding: "15px", borderRadius: "8px", border: "1px solid #eee" },
  qCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" },
  qActions: { display: "flex", gap: "8px", flexShrink: 0 },
  editBtn: { padding: "5px 10px", fontSize: "12px", border: "1px solid #2563eb", background: "#fff", color: "#2563eb", borderRadius: "5px", cursor: "pointer" },
  deleteBtn: { padding: "5px 10px", fontSize: "12px", border: "1px solid #dc2626", background: "#fff", color: "#dc2626", borderRadius: "5px", cursor: "pointer" },
  qMeta: { fontSize: "12px", color: "#888", marginTop: "5px", textTransform: "capitalize" },
  // Sections
  sectionsContainer: {},
  sectionCard: { backgroundColor: "white", borderRadius: "10px", border: "1px solid #e0e0e0", marginBottom: "16px", overflow: "hidden" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #e0e0e0", flexWrap: "wrap", gap: "10px" },
  sectionTitleRow: { display: "flex", alignItems: "center", gap: "10px" },
  sectionBadge: { backgroundColor: "#1a1a2e", color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  sectionTitle: { fontWeight: "600", fontSize: "15px", color: "#1a1a2e" },
  sectionActions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  expandBtn: { padding: "5px 12px", fontSize: "12px", border: "1px solid #27ae60", background: "#fff", color: "#27ae60", borderRadius: "5px", cursor: "pointer" },
  collapseBtn: { padding: "5px 12px", fontSize: "12px", border: "1px solid #888", background: "#fff", color: "#888", borderRadius: "5px", cursor: "pointer" },
  passagePreview: { padding: "12px 16px", fontSize: "13px", color: "#555", lineHeight: "1.6", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" },
  sectionQuestions: { padding: "16px" },
  sqHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  addSmallBtn: { padding: "6px 12px", fontSize: "12px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  sqCard: { backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "12px", marginBottom: "8px", border: "1px solid #eee" },
  sqTop: { display: "flex", alignItems: "flex-start", gap: "10px" },
  qNum: { backgroundColor: "#1a1a2e", color: "white", borderRadius: "4px", padding: "2px 8px", fontSize: "12px", fontWeight: "700", flexShrink: 0 },
  sqText: { flex: 1, fontSize: "14px", color: "#333" },
  // Modal
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "20px" },
  modal: { backgroundColor: "white", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { margin: "0 0 20px", fontSize: "18px", color: "#1a1a2e" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "6px", marginTop: "14px" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", resize: "vertical", boxSizing: "border-box", lineHeight: "1.6" },
  modalBtns: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" },
  cancelBtn: { padding: "10px 20px", backgroundColor: "white", color: "#666", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer" },
  saveBtn: { padding: "10px 24px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  saveBtnDisabled: { padding: "10px 24px", backgroundColor: "#999", color: "white", border: "none", borderRadius: "6px", cursor: "not-allowed" },
};