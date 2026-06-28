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

  const openAddForm = () => { setEditingQuestion(null); setShowForm(true); };
  const openEditForm = (q) => { setEditingQuestion(q); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingQuestion(null); };
  const handleFormSuccess = () => { closeForm(); fetchTest(); };

  const handleDelete = async (questionId) => {
    if (!window.confirm("Delete karna hai?")) return;
    setDeletingId(questionId);
    try {
      await API.delete(`/tests/${testId}/questions/${questionId}`);
      fetchTest();
    } catch (err) { alert("Delete nahi ho saka."); }
    setDeletingId(null);
  };

  const openAddSection = () => {
    setEditingSection(null);
    setSectionForm({ passageTitle: "", passage: "", audioUrl: "" });
    setShowSectionForm(true);
  };

  const openEditSection = (sec) => {
    setEditingSection(sec);
    setSectionForm({
      passageTitle: sec.passageTitle || "",
      passage: sec.passage || "",
      audioUrl: sec.audioUrl || "",
    });
    setShowSectionForm(true);
  };

  const handleSaveSection = async () => {
    if (activeModule === "reading" && !sectionForm.passage.trim()) {
      alert("Passage likhna zaroori hai.");
      return;
    }
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
    if (!window.confirm("Section aur iske questions delete ho jayenge. Confirm?")) return;
    try {
      await API.delete(`/tests/${testId}/sections/${sectionId}`);
      if (activeSectionId === sectionId) setActiveSectionId(null);
      fetchTest();
    } catch (err) { alert("Section delete nahi ho saka."); }
  };

  const handleDeleteSectionQuestion = async (sectionId, questionId) => {
    if (!window.confirm("Delete karna hai?")) return;
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
  const sections = test.sections || []; // ← module filter nahi, sab sections
  const isReadingOrListening = activeModule === "reading" || activeModule === "listening";

  return (
    <div style={styles.page}>
      <Link to="/tests" style={styles.backLink}>← Back to Tests</Link>

      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>{test.title}</h2>
        <p style={styles.subtitle}>{test.description}</p>
      </div>

      <ModuleTabs activeModule={activeModule} onChange={setActiveModule} />

      {/* ── READING / LISTENING — Sections ── */}
      {isReadingOrListening && (
        <div style={styles.sectionsContainer}>
          <div style={styles.listHeader}>
            <h3 style={{ margin: 0, textTransform: "capitalize" }}>
              {activeModule} Sections ({sections.length})
            </h3>
            <button style={styles.addBtn} onClick={openAddSection}>+ Add Section</button>
          </div>

          {/* Section Form */}
          {showSectionForm && (
            <div style={styles.sectionFormBox}>
              <h4 style={{ margin: "0 0 14px" }}>
                {editingSection ? "Edit Section" : "New Section"}
              </h4>

              <label style={styles.label}>Passage Title</label>
              <input
                style={styles.input}
                placeholder="e.g. The History of Aviation"
                value={sectionForm.passageTitle}
                onChange={(e) => setSectionForm({ ...sectionForm, passageTitle: e.target.value })}
              />

              {activeModule === "reading" && (
                <>
                  <label style={styles.label}>Passage Text *</label>
                  <textarea
                    style={styles.textarea}
                    rows={8}
                    placeholder="Yahan poora passage likhein..."
                    value={sectionForm.passage}
                    onChange={(e) => setSectionForm({ ...sectionForm, passage: e.target.value })}
                  />
                </>
              )}

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

              <div style={styles.formBtns}>
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
          )}

          {sections.length === 0 ? (
            <p style={styles.empty}>Abhi koi section nahi. "Add Section" se shuru karein.</p>
          ) : (
            sections.map((sec, sIdx) => (
              <div key={sec._id} style={styles.sectionCard}>
                {/* Section Header */}
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionTitleRow}>
                    <span style={styles.sectionBadge}>Section {sIdx + 1}</span>
                    <span style={styles.sectionTitle}>{sec.passageTitle || "Untitled Passage"}</span>
                    <span style={styles.qCount}>{sec.questions?.length || 0} questions</span>
                  </div>
                  <div style={styles.sectionActions}>
                    <button style={styles.editBtn} onClick={() => openEditSection(sec)}>Edit Passage</button>
                    <button style={styles.deleteBtn} onClick={() => handleDeleteSection(sec._id)}>Delete</button>
                    <button
                      style={activeSectionId === sec._id ? styles.collapseBtn : styles.expandBtn}
                      onClick={() => setActiveSectionId(activeSectionId === sec._id ? null : sec._id)}
                    >
                      {activeSectionId === sec._id ? "▲ Hide" : "▼ Show"} Questions
                    </button>
                  </div>
                </div>

                {/* Passage Preview */}
                {sec.passage && (
                  <div style={styles.passagePreview}>
                    {sec.passage.substring(0, 200)}{sec.passage.length > 200 ? "..." : ""}
                  </div>
                )}
                {sec.audioUrl && (
                  <div style={styles.audioPreview}>
                    🔊 Audio: <a href={sec.audioUrl} target="_blank" rel="noreferrer">{sec.audioUrl}</a>
                  </div>
                )}

                {/* Questions */}
                {activeSectionId === sec._id && (
                  <div style={styles.questionsBox}>
                    <div style={styles.qHeader}>
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

                    {(!sec.questions || sec.questions.length === 0) ? (
                      <p style={styles.emptySmall}>Koi question nahi. Add karo.</p>
                    ) : (
                      sec.questions.map((q, qIdx) => (
                        <div key={q._id} style={styles.qCard}>
                          <div style={styles.qTop}>
                            <span style={styles.qNum}>Q{qIdx + 1}</span>
                            <span style={styles.qText}>{q.question}</span>
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
                          <div style={styles.qMeta}>
                            {q.questionType} · Answer: <b style={{ color: "#27ae60" }}>{q.answer}</b>
                          </div>
                          {q.options?.length > 0 && (
                            <div style={styles.qOptions}>{q.options.join(" | ")}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── WRITING / SPEAKING ── */}
      {!isReadingOrListening && (
        <div style={{ marginTop: "20px" }}>
          <div style={styles.listHeader}>
            <h3 style={{ margin: 0, textTransform: "capitalize" }}>
              {activeModule} Tasks ({filteredQuestions.length})
            </h3>
            <button style={styles.addBtn} onClick={openAddForm}>+ Add Question</button>
          </div>

          {filteredQuestions.length === 0 ? (
            <p style={styles.empty}>Koi question nahi.</p>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div key={q._id} style={styles.qCard}>
                <div style={styles.qTop}>
                  <span style={styles.qNum}>T{idx + 1}</span>
                  <span style={styles.qText}>{q.question}</span>
                  <div style={styles.qActions}>
                    <button style={styles.editBtn} onClick={() => openEditForm(q)}>Edit</button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(q._id)}
                      disabled={deletingId === q._id}
                    >
                      {deletingId === q._id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
                <div style={styles.qMeta}>{q.questionType}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Question Form Modal */}
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
  sectionsContainer: { marginTop: "10px" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 15px" },
  addBtn: { padding: "10px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  empty: { color: "#888", fontStyle: "italic" },
  emptySmall: { color: "#aaa", fontSize: "13px", fontStyle: "italic", padding: "8px 0" },
  sectionFormBox: { backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "20px", marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "6px", marginTop: "12px" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", resize: "vertical", boxSizing: "border-box", lineHeight: "1.6" },
  formBtns: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" },
  cancelBtn: { padding: "9px 18px", backgroundColor: "white", color: "#666", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer" },
  saveBtn: { padding: "9px 22px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  saveBtnDisabled: { padding: "9px 22px", backgroundColor: "#999", color: "white", border: "none", borderRadius: "6px", cursor: "not-allowed" },
  sectionCard: { backgroundColor: "white", borderRadius: "10px", border: "1px solid #e0e0e0", marginBottom: "14px", overflow: "hidden" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #e0e0e0", flexWrap: "wrap", gap: "10px" },
  sectionTitleRow: { display: "flex", alignItems: "center", gap: "10px" },
  sectionBadge: { backgroundColor: "#1a1a2e", color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  sectionTitle: { fontWeight: "600", fontSize: "15px", color: "#1a1a2e" },
  qCount: { fontSize: "12px", color: "#3498db", backgroundColor: "#eef2ff", padding: "2px 8px", borderRadius: "10px" },
  sectionActions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  editBtn: { padding: "5px 10px", fontSize: "12px", border: "1px solid #2563eb", background: "#fff", color: "#2563eb", borderRadius: "5px", cursor: "pointer" },
  deleteBtn: { padding: "5px 10px", fontSize: "12px", border: "1px solid #dc2626", background: "#fff", color: "#dc2626", borderRadius: "5px", cursor: "pointer" },
  expandBtn: { padding: "5px 12px", fontSize: "12px", border: "1px solid #27ae60", background: "#fff", color: "#27ae60", borderRadius: "5px", cursor: "pointer" },
  collapseBtn: { padding: "5px 12px", fontSize: "12px", border: "1px solid #888", background: "#fff", color: "#888", borderRadius: "5px", cursor: "pointer" },
  passagePreview: { padding: "10px 16px", fontSize: "13px", color: "#555", lineHeight: "1.6", backgroundColor: "#fafafa", borderBottom: "1px solid #f0f0f0" },
  audioPreview: { padding: "8px 16px", fontSize: "13px", color: "#3498db", backgroundColor: "#f0f8ff" },
  questionsBox: { padding: "16px" },
  qHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  addSmallBtn: { padding: "6px 12px", fontSize: "12px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  qCard: { backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "12px", marginBottom: "8px", border: "1px solid #eee" },
  qTop: { display: "flex", alignItems: "flex-start", gap: "10px" },
  qNum: { backgroundColor: "#1a1a2e", color: "white", borderRadius: "4px", padding: "2px 8px", fontSize: "12px", fontWeight: "700", flexShrink: 0 },
  qText: { flex: 1, fontSize: "14px", color: "#333" },
  qActions: { display: "flex", gap: "6px", flexShrink: 0 },
  qMeta: { fontSize: "12px", color: "#888", marginTop: "6px", textTransform: "capitalize" },
  qOptions: { fontSize: "12px", color: "#666", marginTop: "4px" },
};