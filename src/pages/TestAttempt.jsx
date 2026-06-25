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
      // Start / resume attempt
      const attemptRes = await axios.post(`${API}/attempts/start`, { testId }, { headers });
      const att = attemptRes.data.attempt;
      setAttempt(att);

      // Fetch test details
      const testsRes = await axios.get(`${API}/tests`, { headers });
      const found = testsRes.data.data.find((t) => t._id === testId);
      setTest(found);

      // Pre-fill saved answers
      const savedAnswers = {};
      att.answers.forEach((a) => {
        savedAnswers[a.questionId] = a.selected || a.writingResponse || a.speakingResponse || "";
      });
      setAnswers(savedAnswers);

      // Timer: minutes remaining
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

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const autoSave = async () => {
    if (!attempt) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const currentQs = getModuleQuestions(MODULES[currentModule]);
      const answersPayload = currentQs.map((q) => ({
        questionId: q._id,
        module: q.module,
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
    window.scrollTo(0, 0);
  };

  const handlePrevModule = async () => {
    await autoSave();
    setCurrentModule((m) => m - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // Save all answers first
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
      await axios.post(`${API}/attempts/${attempt._id}/save`, { answers: allAnswers }, { headers });
      // Submit
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

  // ── Question Renderers ──────────────────────────

  const renderMCQ = (q) => (
    <div style={styles.optionsList}>
      {q.options.map((opt, i) => (
        <label key={i} style={{ ...styles.optionLabel, ...(answers[q._id] === opt ? styles.optionSelected : {}) }}>
          <input
            type="radio"
            name={q._id}
            value={opt}
            checked={answers[q._id] === opt}
            onChange={() => handleAnswer(q._id, opt)}
            style={{ marginRight: "10px" }}
          />
          {opt}
        </label>
      ))}
    </div>
  );

  const renderTrueFalse = (q) => (
    <div style={styles.optionsList}>
      {["True", "False", "Not Given"].map((opt) => (
        <label key={opt} style={{ ...styles.optionLabel, ...(answers[q._id] === opt ? styles.optionSelected : {}) }}>
          <input
            type="radio"
            name={q._id}
            value={opt}
            checked={answers[q._id] === opt}
            onChange={() => handleAnswer(q._id, opt)}
            style={{ marginRight: "10px" }}
          />
          {opt}
        </label>
      ))}
    </div>
  );

  const renderFillBlank = (q) => (
    <input
      style={styles.textInput}
      type="text"
      placeholder="Apna jawab likhein..."
      value={answers[q._id] || ""}
      onChange={(e) => handleAnswer(q._id, e.target.value)}
    />
  );

  const renderWriting = (q) => (
    <div>
      <textarea
        style={styles.textarea}
        placeholder="Apna essay yahan likhein..."
        value={answers[q._id] || ""}
        onChange={(e) => handleAnswer(q._id, e.target.value)}
        rows={12}
      />
      <div style={styles.wordCount}>
        Words: {(answers[q._id] || "").trim().split(/\s+/).filter(Boolean).length}
        {q.wordLimit ? ` / ${q.wordLimit} minimum` : ""}
      </div>
    </div>
  );

  const renderSpeaking = (q) => (
    <div>
      <div style={styles.speakingInfo}>
        <span>⏱ Prep time: {q.prepTimeSeconds || 60}s</span>
        <span>🎤 Speaking time: {q.speakingTimeSeconds || 120}s</span>
      </div>
      <textarea
        style={styles.textarea}
        placeholder="Speaking notes yahan likhein (optional)..."
        value={answers[q._id] || ""}
        onChange={(e) => handleAnswer(q._id, e.target.value)}
        rows={6}
      />
    </div>
  );

  const renderQuestion = (q, idx) => {
    const typeLabel = {
      mcq: "Multiple Choice",
      true_false_not_given: "True / False / Not Given",
      matching_headings: "Matching Headings",
      fill_blank: "Fill in the Blank",
      short_answer: "Short Answer",
      writing_task1: "Writing Task 1",
      writing_task2: "Writing Task 2",
      speaking_part1: "Speaking Part 1",
      speaking_part2_cue_card: "Speaking Part 2 — Cue Card",
      speaking_part3: "Speaking Part 3",
    }[q.questionType] || q.questionType;

    return (
      <div key={q._id} style={styles.questionCard}>
        <div style={styles.questionHeader}>
          <span style={styles.qNum}>Q{idx + 1}</span>
          <span style={styles.qType}>{typeLabel}</span>
          <span style={styles.qMarks}>{q.marks || 1} mark</span>
        </div>

        {/* Passage */}
        {q.passage && (
          <div style={styles.passage}>
            <strong style={{ display: "block", marginBottom: "8px", color: "#555" }}>📖 Reading Passage:</strong>
            {q.passage}
          </div>
        )}

        {/* Audio */}
        {q.audioUrl && (
          <div style={styles.mediaBox}>
            <span>🔊 Audio:</span>
            <a href={q.audioUrl} target="_blank" rel="noreferrer" style={styles.mediaLink}>
              Play Audio
            </a>
          </div>
        )}

        {/* Image */}
        {q.imageUrl && (
          <div style={styles.mediaBox}>
            <span>🖼 Image:</span>
            <a href={q.imageUrl} target="_blank" rel="noreferrer" style={styles.mediaLink}>
              View Image
            </a>
          </div>
        )}

        {/* Question text */}
        <p style={styles.questionText}>{q.question}</p>

        {/* Cue card points */}
        {q.cueCardPoints?.length > 0 && (
          <ul style={styles.cueList}>
            {q.cueCardPoints.map((pt, i) => <li key={i}>{pt}</li>)}
          </ul>
        )}

        {/* Answer input */}
        {["mcq", "matching_headings"].includes(q.questionType) && renderMCQ(q)}
        {q.questionType === "true_false_not_given" && renderTrueFalse(q)}
        {["fill_blank", "short_answer"].includes(q.questionType) && renderFillBlank(q)}
        {["writing_task1", "writing_task2"].includes(q.questionType) && renderWriting(q)}
        {["speaking_part1", "speaking_part2_cue_card", "speaking_part3"].includes(q.questionType) && renderSpeaking(q)}
      </div>
    );
  };

  if (loading) return <div style={styles.loadingPage}>Loading test...</div>;
  if (!test) return <div style={styles.loadingPage}>Test nahi mila</div>;

  const currentModuleName = MODULES[currentModule];
  const currentQuestions = getModuleQuestions(currentModuleName);
  const answeredCount = currentQuestions.filter((q) => answers[q._id]).length;
  const isLastModule = currentModule === MODULES.length - 1;

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.testInfo}>
          <span style={styles.testName}>📝 {test.title}</span>
        </div>
        <div style={styles.timerBox} style={{ ...styles.timerBox, borderColor: getTimerColor() }}>
          <span style={{ color: getTimerColor(), fontWeight: "700", fontSize: "20px" }}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
        <button style={styles.submitTopBtn} onClick={() => setShowConfirm(true)}>
          Submit Test
        </button>
      </div>

      {/* Module Tabs */}
      <div style={styles.moduleTabs}>
        {MODULES.map((mod, i) => {
          const modQs = getModuleQuestions(mod);
          const modAnswered = modQs.filter((q) => answers[q._id]).length;
          return (
            <button
              key={mod}
              style={{
                ...styles.moduleTab,
                ...(i === currentModule ? styles.moduleTabActive : {}),
                ...(modQs.length === 0 ? styles.moduleTabEmpty : {}),
              }}
              onClick={async () => { await autoSave(); setCurrentModule(i); window.scrollTo(0, 0); }}
            >
              {mod.charAt(0).toUpperCase() + mod.slice(1)}
              {modQs.length > 0 && (
                <span style={styles.modProgress}> {modAnswered}/{modQs.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div style={styles.content}>
        <div style={styles.moduleHeader}>
          <h3 style={styles.moduleTitle}>
            {currentModuleName.charAt(0).toUpperCase() + currentModuleName.slice(1)} Section
          </h3>
          <span style={styles.progressText}>
            {answeredCount} / {currentQuestions.length} answered
          </span>
        </div>

        {currentQuestions.length === 0 ? (
          <div style={styles.emptyModule}>
            Is module mein koi question nahi hai
          </div>
        ) : (
          currentQuestions.map((q, idx) => renderQuestion(q, idx))
        )}

        {/* Navigation */}
        <div style={styles.navRow}>
          {currentModule > 0 && (
            <button style={styles.prevBtn} onClick={handlePrevModule}>
              ← Previous
            </button>
          )}
          <div style={{ flex: 1 }} />
          {!isLastModule ? (
            <button style={styles.nextBtn} onClick={handleNextModule}>
              Next Section →
            </button>
          ) : (
            <button style={styles.submitBtn} onClick={() => setShowConfirm(true)}>
              Submit Test ✓
            </button>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Test Submit karna chahte ho?</h3>
            <p style={styles.modalText}>
              Ek dafa submit karne ke baad wapis nahi aa sakte.
            </p>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button
                style={submitting ? styles.submitBtnDisabled : styles.confirmBtn}
                onClick={handleSubmit}
                disabled={submitting}
              >
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
  testInfo: { flex: 1 },
  testName: { fontSize: "15px", fontWeight: "600" },
  timerBox: { border: "2px solid", borderRadius: "10px", padding: "6px 16px", margin: "0 20px" },
  submitTopBtn: { padding: "8px 16px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  moduleTabs: { display: "flex", backgroundColor: "white", borderBottom: "2px solid #e0e0e0", padding: "0 24px" },
  moduleTab: { padding: "12px 20px", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "14px", color: "#666", borderBottom: "3px solid transparent", marginBottom: "-2px" },
  moduleTabActive: { color: "#1a1a2e", borderBottom: "3px solid #1a1a2e", fontWeight: "700" },
  moduleTabEmpty: { opacity: 0.4 },
  modProgress: { fontSize: "12px", color: "#3498db" },
  content: { maxWidth: "800px", margin: "0 auto", padding: "24px 20px" },
  moduleHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  moduleTitle: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#1a1a2e" },
  progressText: { fontSize: "13px", color: "#888", backgroundColor: "white", padding: "6px 12px", borderRadius: "20px" },
  emptyModule: { textAlign: "center", padding: "60px", color: "#aaa", backgroundColor: "white", borderRadius: "12px" },
  questionCard: { backgroundColor: "white", borderRadius: "12px", padding: "24px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  questionHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
  qNum: { backgroundColor: "#1a1a2e", color: "white", borderRadius: "6px", padding: "3px 10px", fontSize: "13px", fontWeight: "700" },
  qType: { backgroundColor: "#eef2ff", color: "#3498db", borderRadius: "6px", padding: "3px 10px", fontSize: "12px" },
  qMarks: { marginLeft: "auto", fontSize: "12px", color: "#888" },
  passage: { backgroundColor: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px", marginBottom: "16px", fontSize: "14px", lineHeight: "1.7", color: "#444" },
  mediaBox: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fff8e1", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "14px" },
  mediaLink: { color: "#3498db", textDecoration: "none", fontWeight: "600" },
  questionText: { fontSize: "15px", color: "#1a1a2e", lineHeight: "1.6", marginBottom: "16px", whiteSpace: "pre-line" },
  cueList: { backgroundColor: "#f0f4f8", padding: "12px 12px 12px 28px", borderRadius: "8px", marginBottom: "14px", fontSize: "14px", color: "#444", lineHeight: "1.8" },
  optionsList: { display: "flex", flexDirection: "column", gap: "10px" },
  optionLabel: { display: "flex", alignItems: "center", padding: "12px 16px", border: "2px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" },
  optionSelected: { border: "2px solid #1a1a2e", backgroundColor: "#f0f4ff" },
  textInput: { width: "100%", padding: "12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "14px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: "1.6" },
  wordCount: { textAlign: "right", fontSize: "12px", color: "#888", marginTop: "6px" },
  speakingInfo: { display: "flex", gap: "16px", backgroundColor: "#e8f5e9", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", color: "#27ae60" },
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