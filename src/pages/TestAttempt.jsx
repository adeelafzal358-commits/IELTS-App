import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API = "https://ielts-backend.bonto.run/api";
const MODULES = ["reading", "listening", "writing", "speaking"];

export default function TestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentModule, setCurrentModule] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate("/student/login"); return; }
    init();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const init = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const attemptRes = await axios.post(`${API}/attempts/start`, { testId }, { headers });
      const att = attemptRes.data.attempt;
      setAttempt(att);

      const testsRes = await axios.get(`${API}/tests`, { headers });
      const found = testsRes.data.data.find((t) => t._id === testId);
      setTest(found);

      const savedAnswers = {};
      att.answers.forEach((a) => {
        savedAnswers[a.questionId] = a.selected || a.writingResponse || a.speakingResponse || "";
      });
      setAnswers(savedAnswers);

      const elapsed = Math.floor((Date.now() - new Date(att.startedAt).getTime()) / 1000);
      const total = (found?.duration || 60) * 60;
      setTimeLeft(Math.max(0, total - elapsed));
    } catch (err) {
      if (err.response?.status === 401) navigate("/student/login");
    } finally {
      setLoading(false);
    }
  };

  const getModuleQuestions = (moduleName) => {
    if (!test) return [];
    return test.questions.filter((q) => q.module === moduleName);
  };

  const getModuleSections = () => {
    if (!test) return [];
    return test.sections || [];
  };

  const getAllSectionQuestions = () => {
    const sections = getModuleSections();
    const all = [];
    sections.forEach((sec) => {
      (sec.questions || []).forEach((q) => all.push(q));
    });
    return all;
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const autoSave = async () => {
    if (!attempt || !test) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const currentModuleName = MODULES[currentModule];
      let questionsToSave = [];

      if (currentModuleName === "reading" || currentModuleName === "listening") {
        const sections = getModuleSections();
        if (sections.length > 0) {
          questionsToSave = getAllSectionQuestions();
        } else {
          questionsToSave = getModuleQuestions(currentModuleName);
        }
      } else {
        questionsToSave = getModuleQuestions(currentModuleName);
      }

      const answersPayload = questionsToSave.map((q) => ({
        questionId: q._id,
        module: q.module || currentModuleName,
        questionType: q.questionType,
        selected: ["mcq", "true_false_not_given", "matching_headings", "fill_blank", "short_answer"].includes(q.questionType)
          ? answers[q._id] || null : null,
        writingResponse: ["writing_task1", "writing_task2"].includes(q.questionType)
          ? answers[q._id] || null : null,
        speakingResponse: ["speaking_part1", "speaking_part2_cue_card", "speaking_part3"].includes(q.questionType)
          ? answers[q._id] || null : null,
      }));

      await axios.post(`${API}/attempts/${attempt._id}/save`, { answers: answersPayload }, { headers });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const handleNextModule = async () => {
    await autoSave();
    setCurrentModule((m) => m + 1);
    setActiveSectionIdx(0);
    window.scrollTo(0, 0);
  };

  const handlePrevModule = async () => {
    await autoSave();
    setCurrentModule((m) => m - 1);
    setActiveSectionIdx(0);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const allAnswers = [];

      test.questions.forEach((q) => {
        allAnswers.push({
          questionId: q._id,
          module: q.module,
          questionType: q.questionType,
          selected: ["mcq", "true_false_not_given", "matching_headings", "fill_blank", "short_answer"].includes(q.questionType)
            ? answers[q._id] || null : null,
          writingResponse: ["writing_task1", "writing_task2"].includes(q.questionType)
            ? answers[q._id] || null : null,
          speakingResponse: ["speaking_part1", "speaking_part2_cue_card", "speaking_part3"].includes(q.questionType)
            ? answers[q._id] || null : null,
        });
      });

      getAllSectionQuestions().forEach((q) => {
        allAnswers.push({
          questionId: q._id,
          module: q.module || "reading",
          questionType: q.questionType,
          selected: ["mcq", "true_false_not_given", "matching_headings", "fill_blank", "short_answer"].includes(q.questionType)
            ? answers[q._id] || null : null,
          writingResponse: null,
          speakingResponse: null,
        });
      });

      await axios.post(`${API}/attempts/${attempt._id}/save`, { answers: allAnswers }, { headers });
      const res = await axios.post(`${API}/attempts/${attempt._id}/submit`, {}, { headers });
      navigate(`/my-results/${res.data.attempt._id}`);
    } catch (err) {
      console.error("Submit failed", err);
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getTimerColor = () => {
    if (timeLeft === null) return "#27ae60";
    if (timeLeft < 300) return "#e74c3c";
    if (timeLeft < 600) return "#f39c12";
    return "#27ae60";
  };

  // ── Question Renderers ──
  const renderMCQ = (q) => (
    <div style={styles.optionsList}>
      {q.options.map((opt, i) => (
        <label key={i} style={{ ...styles.optionLabel, ...(answers[q._id] === opt ? styles.optionSelected : {}) }}>
          <input type="radio" name={q._id} value={opt} checked={answers[q._id] === opt}
            onChange={() => handleAnswer(q._id, opt)} style={{ marginRight: "10px" }} />
          {opt}
        </label>
      ))}
    </div>
  );

  const renderTrueFalse = (q) => (
    <div style={styles.optionsList}>
      {["True", "False", "Not Given"].map((opt) => (
        <label key={opt} style={{ ...styles.optionLabel, ...(answers[q._id] === opt ? styles.optionSelected : {}) }}>
          <input type="radio" name={q._id} value={opt} checked={answers[q._id] === opt}
            onChange={() => handleAnswer(q._id, opt)} style={{ marginRight: "10px" }} />
          {opt}
        </label>
      ))}
    </div>
  );

  const renderFillBlank = (q) => (
    <input style={styles.textInput} type="text" placeholder="Answer likhein..."
      value={answers[q._id] || ""} onChange={(e) => handleAnswer(q._id, e.target.value)} />
  );

  const renderWriting = (q) => (
    <div>
      <textarea style={styles.textarea} placeholder="Essay yahan likhein..."
        value={answers[q._id] || ""} onChange={(e) => handleAnswer(q._id, e.target.value)} rows={12} />
      <div style={styles.wordCount}>
        Words: {(answers[q._id] || "").trim().split(/\s+/).filter(Boolean).length}
        {q.wordLimit ? ` / ${q.wordLimit} minimum` : ""}
      </div>
    </div>
  );

  const renderSpeaking = (q) => (
    <div>
      <div style={styles.speakingInfo}>
        <span>⏱ Prep: {q.prepTimeSeconds || 60}s</span>
        <span>🎤 Speaking: {q.speakingTimeSeconds || 120}s</span>
      </div>
      <textarea style={styles.textarea} placeholder="Notes (optional)..."
        value={answers[q._id] || ""} onChange={(e) => handleAnswer(q._id, e.target.value)} rows={6} />
    </div>
  );

  const renderQuestion = (q, idx) => {
    const typeLabel = {
      mcq: "Multiple Choice", true_false_not_given: "True / False / Not Given",
      matching_headings: "Matching Headings", fill_blank: "Fill in the Blank",
      short_answer: "Short Answer", writing_task1: "Writing Task 1",
      writing_task2: "Writing Task 2", speaking_part1: "Speaking Part 1",
      speaking_part2_cue_card: "Speaking Part 2", speaking_part3: "Speaking Part 3",
    }[q.questionType] || q.questionType;

    return (
      <div key={q._id} style={styles.questionCard}>
        <div style={styles.questionHeader}>
          <span style={styles.qNum}>Q{idx + 1}</span>
          <span style={styles.qType}>{typeLabel}</span>
          <span style={styles.qMarks}>{q.marks || 1} mark</span>
        </div>
        {q.audioUrl && (
          <div style={styles.mediaBox}>
            <span>🔊</span>
            <a href={q.audioUrl} target="_blank" rel="noreferrer" style={styles.mediaLink}>Play Audio</a>
          </div>
        )}
        {q.imageUrl && (
          <div style={styles.mediaBox}>
            <span>🖼</span>
            <a href={q.imageUrl} target="_blank" rel="noreferrer" style={styles.mediaLink}>View Image</a>
          </div>
        )}
        <p style={styles.questionText}>{q.question}</p>
        {q.cueCardPoints?.length > 0 && (
          <ul style={styles.cueList}>
            {q.cueCardPoints.map((pt, i) => <li key={i}>{pt}</li>)}
          </ul>
        )}
        {["mcq", "matching_headings"].includes(q.questionType) && renderMCQ(q)}
        {q.questionType === "true_false_not_given" && renderTrueFalse(q)}
        {["fill_blank", "short_answer"].includes(q.questionType) && renderFillBlank(q)}
        {["writing_task1", "writing_task2"].includes(q.questionType) && renderWriting(q)}
        {["speaking_part1", "speaking_part2_cue_card", "speaking_part3"].includes(q.questionType) && renderSpeaking(q)}
      </div>
    );
  };

  // ── Reading Split Screen ──
  const renderReadingModule = () => {
    const sections = getModuleSections();

    // ── Sections wala data hai ──
    if (sections.length > 0) {
      const section = sections[activeSectionIdx];
      const sectionQuestions = section?.questions || [];
      const answered = sectionQuestions.filter((q) => answers[q._id]).length;

      return (
        <div>
          {sections.length > 1 && (
            <div style={styles.sectionTabs}>
              {sections.map((sec, i) => (
                <button key={sec._id}
                  style={{ ...styles.sectionTab, ...(i === activeSectionIdx ? styles.sectionTabActive : {}) }}
                  onClick={() => setActiveSectionIdx(i)}>
                  Section {i + 1}{sec.passageTitle ? ` — ${sec.passageTitle.substring(0, 20)}` : ""}
                </button>
              ))}
            </div>
          )}
          <div style={styles.splitScreen}>
            <div style={styles.passagePanel}>
              <div style={styles.passagePanelHeader}>
                <span style={styles.passagePanelTitle}>📖 {section.passageTitle || `Section ${activeSectionIdx + 1}`}</span>
                <span style={styles.passageProgress}>{answered}/{sectionQuestions.length} answered</span>
              </div>
              <div style={styles.passageText}>{section.passage}</div>
            </div>
            <div style={styles.questionsPanel}>
              <div style={styles.questionsPanelHeader}>
                <span style={styles.questionsPanelTitle}>Questions</span>
              </div>
              <div style={styles.questionsList}>
                {sectionQuestions.length === 0 ? (
                  <div style={styles.emptyModule}>Koi question nahi.</div>
                ) : (
                  sectionQuestions.map((q, idx) => renderQuestion(q, idx))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Fallback: Flat questions se groups banao ──
    const flatQuestions = getModuleQuestions("reading");
    if (flatQuestions.length === 0) {
      return <div style={styles.emptyModule}>Reading questions nahi hain.</div>;
    }

    const groups = [];
    let currentGroup = null;
    flatQuestions.forEach((q) => {
      if (!currentGroup || (q.passage && q.passage !== currentGroup.passage)) {
        currentGroup = { passage: q.passage || "", questions: [] };
        groups.push(currentGroup);
      }
      currentGroup.questions.push(q);
    });

    const group = groups[activeSectionIdx] || groups[0];
    const answered = (group?.questions || []).filter((q) => answers[q._id]).length;

    return (
      <div>
        {groups.length > 1 && (
          <div style={styles.sectionTabs}>
            {groups.map((g, i) => (
              <button key={i}
                style={{ ...styles.sectionTab, ...(i === activeSectionIdx ? styles.sectionTabActive : {}) }}
                onClick={() => setActiveSectionIdx(i)}>
                Passage {i + 1}
              </button>
            ))}
          </div>
        )}
        <div style={styles.splitScreen}>
          <div style={styles.passagePanel}>
            <div style={styles.passagePanelHeader}>
              <span style={styles.passagePanelTitle}>📖 Reading Passage</span>
              <span style={styles.passageProgress}>{answered}/{group?.questions?.length || 0} answered</span>
            </div>
            <div style={styles.passageText}>
              {group?.passage || "Koi passage nahi hai."}
            </div>
          </div>
          <div style={styles.questionsPanel}>
            <div style={styles.questionsPanelHeader}>
              <span style={styles.questionsPanelTitle}>Questions</span>
            </div>
            <div style={styles.questionsList}>
              {(group?.questions || []).map((q, idx) => renderQuestion(q, idx))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={styles.loadingPage}>Loading test...</div>;
  if (!test) return <div style={styles.loadingPage}>Test nahi mila</div>;

  const currentModuleName = MODULES[currentModule];
  const currentQuestions = getModuleQuestions(currentModuleName);
  const isLastModule = currentModule === MODULES.length - 1;
  const isReading = currentModuleName === "reading";

  const sections = getModuleSections();
  const answeredCount = isReading
    ? sections.length > 0
      ? getAllSectionQuestions().filter((q) => answers[q._id]).length
      : currentQuestions.filter((q) => answers[q._id]).length
    : currentQuestions.filter((q) => answers[q._id]).length;

  const totalCount = isReading
    ? sections.length > 0
      ? getAllSectionQuestions().length
      : currentQuestions.length
    : currentQuestions.length;

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <span style={styles.testName}>📝 {test.title}</span>
        <div style={{ ...styles.timerBox, borderColor: getTimerColor() }}>
          <span style={{ color: getTimerColor(), fontWeight: "700", fontSize: "20px" }}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
        <button style={styles.submitTopBtn} onClick={() => setShowConfirm(true)}>Submit Test</button>
      </div>

      {/* Module Tabs */}
      <div style={styles.moduleTabs}>
        {MODULES.map((mod, i) => {
          const isRd = mod === "reading";
          const modQs = isRd && sections.length > 0
            ? getAllSectionQuestions()
            : getModuleQuestions(mod);
          const modAnswered = modQs.filter((q) => answers[q._id]).length;
          return (
            <button key={mod}
              style={{ ...styles.moduleTab, ...(i === currentModule ? styles.moduleTabActive : {}) }}
              onClick={async () => { await autoSave(); setCurrentModule(i); setActiveSectionIdx(0); window.scrollTo(0, 0); }}>
              {mod.charAt(0).toUpperCase() + mod.slice(1)}
              {modQs.length > 0 && <span style={styles.modProgress}> {modAnswered}/{modQs.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Module Header */}
      <div style={styles.moduleHeaderBar}>
        <h3 style={styles.moduleTitle}>
          {currentModuleName.charAt(0).toUpperCase() + currentModuleName.slice(1)} Section
        </h3>
        <span style={styles.progressText}>{answeredCount} / {totalCount} answered</span>
      </div>

      {/* Content */}
      <div style={isReading ? styles.fullWidth : styles.content}>
        {isReading ? renderReadingModule() : (
          currentQuestions.length === 0 ? (
            <div style={styles.emptyModule}>Is module mein koi question nahi.</div>
          ) : (
            currentQuestions.map((q, idx) => renderQuestion(q, idx))
          )
        )}

        {/* Navigation */}
        <div style={{ ...styles.navRow, ...(isReading ? { padding: "16px 24px" } : {}) }}>
          {currentModule > 0 && (
            <button style={styles.prevBtn} onClick={handlePrevModule}>← Previous</button>
          )}
          <div style={{ flex: 1 }} />
          {!isLastModule ? (
            <button style={styles.nextBtn} onClick={handleNextModule}>Next Section →</button>
          ) : (
            <button style={styles.submitBtn} onClick={() => setShowConfirm(true)}>Submit Test ✓</button>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Test Submit karna chahte ho?</h3>
            <p style={styles.modalText}>Ek dafa submit ke baad wapis nahi aa sakte.</p>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button style={submitting ? styles.submitBtnDisabled : styles.confirmBtn}
                onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f0f4f8" },
  loadingPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#888" },
  topBar: { backgroundColor: "#1a1a2e", color: "white", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  testName: { fontSize: "15px", fontWeight: "600", flex: 1 },
  timerBox: { border: "2px solid", borderRadius: "10px", padding: "6px 16px", margin: "0 20px" },
  submitTopBtn: { padding: "8px 16px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  moduleTabs: { display: "flex", backgroundColor: "white", borderBottom: "2px solid #e0e0e0", padding: "0 24px" },
  moduleTab: { padding: "12px 20px", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "14px", color: "#666", borderBottom: "3px solid transparent", marginBottom: "-2px" },
  moduleTabActive: { color: "#1a1a2e", borderBottom: "3px solid #1a1a2e", fontWeight: "700" },
  modProgress: { fontSize: "12px", color: "#3498db" },
  moduleHeaderBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", backgroundColor: "white", borderBottom: "1px solid #e0e0e0" },
  moduleTitle: { margin: 0, fontSize: "18px", fontWeight: "700", color: "#1a1a2e" },
  progressText: { fontSize: "13px", color: "#888", backgroundColor: "#f0f4f8", padding: "6px 12px", borderRadius: "20px" },
  fullWidth: { width: "100%" },
  splitScreen: { display: "flex", height: "calc(100vh - 165px)", overflow: "hidden" },
  passagePanel: { width: "50%", borderRight: "2px solid #e0e0e0", display: "flex", flexDirection: "column", backgroundColor: "white" },
  passagePanelHeader: { padding: "14px 20px", backgroundColor: "#1a1a2e", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 },
  passagePanelTitle: { color: "white", fontWeight: "700", fontSize: "14px" },
  passageProgress: { color: "#94a3b8", fontSize: "12px" },
  passageText: { flex: 1, overflowY: "auto", padding: "20px", fontSize: "14px", lineHeight: "1.9", color: "#333", whiteSpace: "pre-line" },
  questionsPanel: { width: "50%", display: "flex", flexDirection: "column", backgroundColor: "#f8f9fa" },
  questionsPanelHeader: { padding: "14px 20px", backgroundColor: "#2563eb", flexShrink: 0 },
  questionsPanelTitle: { color: "white", fontWeight: "700", fontSize: "14px" },
  questionsList: { flex: 1, overflowY: "auto", padding: "16px" },
  sectionTabs: { display: "flex", backgroundColor: "#f0f4f8", padding: "10px 24px", gap: "10px", borderBottom: "1px solid #e0e0e0" },
  sectionTab: { padding: "8px 16px", border: "1px solid #ddd", backgroundColor: "white", borderRadius: "20px", cursor: "pointer", fontSize: "13px", color: "#666" },
  sectionTabActive: { backgroundColor: "#1a1a2e", color: "white", border: "1px solid #1a1a2e", fontWeight: "600" },
  content: { maxWidth: "800px", margin: "0 auto", padding: "24px 20px" },
  emptyModule: { textAlign: "center", padding: "60px", color: "#aaa", backgroundColor: "white", borderRadius: "12px", margin: "20px" },
  questionCard: { backgroundColor: "white", borderRadius: "10px", padding: "20px", marginBottom: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  questionHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
  qNum: { backgroundColor: "#1a1a2e", color: "white", borderRadius: "6px", padding: "3px 10px", fontSize: "13px", fontWeight: "700" },
  qType: { backgroundColor: "#eef2ff", color: "#3498db", borderRadius: "6px", padding: "3px 10px", fontSize: "12px" },
  qMarks: { marginLeft: "auto", fontSize: "12px", color: "#888" },
  mediaBox: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fff8e1", padding: "8px 12px", borderRadius: "8px", marginBottom: "10px", fontSize: "14px" },
  mediaLink: { color: "#3498db", textDecoration: "none", fontWeight: "600" },
  questionText: { fontSize: "15px", color: "#1a1a2e", lineHeight: "1.6", marginBottom: "14px", whiteSpace: "pre-line" },
  cueList: { backgroundColor: "#f0f4f8", padding: "10px 10px 10px 24px", borderRadius: "8px", marginBottom: "12px", fontSize: "14px", color: "#444", lineHeight: "1.8" },
  optionsList: { display: "flex", flexDirection: "column", gap: "8px" },
  optionLabel: { display: "flex", alignItems: "center", padding: "10px 14px", border: "2px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  optionSelected: { border: "2px solid #1a1a2e", backgroundColor: "#f0f4ff" },
  textInput: { width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: "1.6" },
  wordCount: { textAlign: "right", fontSize: "12px", color: "#888", marginTop: "6px" },
  speakingInfo: { display: "flex", gap: "16px", backgroundColor: "#e8f5e9", padding: "10px 14px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px", color: "#27ae60" },
  navRow: { display: "flex", alignItems: "center", marginTop: "24px", gap: "12px" },
  prevBtn: { padding: "12px 24px", backgroundColor: "white", color: "#1a1a2e", border: "2px solid #1a1a2e", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  nextBtn: { padding: "12px 24px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  submitBtn: { padding: "12px 28px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  submitBtnDisabled: { padding: "12px 28px", backgroundColor: "#999", color: "white", border: "none", borderRadius: "8px", cursor: "not-allowed", fontSize: "14px", fontWeight: "600" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal: { backgroundColor: "white", borderRadius: "16px", padding: "32px", maxWidth: "380px", width: "90%", textAlign: "center" },
  modalTitle: { margin: "0 0 12px", fontSize: "18px", color: "#1a1a2e" },
  modalText: { margin: "0 0 24px", fontSize: "14px", color: "#666" },
  modalBtns: { display: "flex", gap: "12px", justifyContent: "center" },
  cancelBtn: { padding: "10px 24px", backgroundColor: "white", color: "#666", border: "2px solid #ddd", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  confirmBtn: { padding: "10px 24px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};