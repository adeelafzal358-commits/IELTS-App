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
};import { useState, useEffect } from "react";
import API from "../services/api";

const MANUAL_TYPES = ["writing_task1", "writing_task2", "speaking_part1", "speaking_part2_cue_card", "speaking_part3"];

export default function Results() {
  const [tab, setTab] = useState("pending"); // "pending" | "all"
  const [pending, setPending] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // selected attempt for scoring
  const [scores, setScores] = useState({}); // { questionId: { score, feedback } }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pendingRes, resultsRes] = await Promise.all([
        API.get("/attempts/admin/pending"),
        API.get("/results"),
      ]);
      setPending(pendingRes.data.attempts || []);
      setResults(resultsRes.data.data || []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const openScoring = (attempt) => {
    setSelected(attempt);
    // Pre-fill existing scores
    const prefilled = {};
    attempt.answers?.forEach((ans) => {
      if (MANUAL_TYPES.includes(ans.questionType)) {
        prefilled[ans.questionId] = {
          score: ans.manualScore ?? "",
          feedback: ans.manualFeedback ?? "",
        };
      }
    });
    setScores(prefilled);
  };

  const handleScoreChange = (questionId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value },
    }));
  };

  const handleSaveScore = async (questionId) => {
    setSaving(true);
    try {
      await API.put(`/attempts/${selected._id}/manual-score`, {
        questionId,
        manualScore: Number(scores[questionId]?.score),
        manualFeedback: scores[questionId]?.feedback || "",
      });
      // Refresh
      const res = await API.get("/attempts/admin/pending");
      setPending(res.data.attempts || []);
      // Update selected
      const updated = res.data.attempts.find((a) => a._id === selected._id);
      if (updated) {
        setSelected(updated);
      } else {
        setSelected(null); // scoring complete
        fetchAll();
      }
    } catch (err) {
      console.log(err);
    }
    setSaving(false);
  };

  const getModuleIcon = (type) => {
    if (type.startsWith("writing")) return "✍️";
    if (type.startsWith("speaking")) return "🎤";
    return "📝";
  };

  const getBandColor = (band) => {
    if (!band) return "#999";
    if (band >= 7) return "#27ae60";
    if (band >= 5) return "#f39c12";
    return "#e74c3c";
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2>📊 Results & Scoring</h2>
        {pending.length > 0 && (
          <span style={styles.pendingBadge}>
            ⏳ {pending.length} Pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={tab === "pending" ? styles.activeTab : styles.inactiveTab}
          onClick={() => setTab("pending")}
        >
          ⏳ Pending Scoring {pending.length > 0 && `(${pending.length})`}
        </button>
        <button
          style={tab === "all" ? styles.activeTab : styles.inactiveTab}
          onClick={() => setTab("all")}
        >
          📋 All Results
        </button>
      </div>

      {/* Pending Tab */}
      {tab === "pending" && (
        <div>
          {pending.length === 0 ? (
            <div style={styles.emptyBox}>
              ✅ Koi pending scoring nahi hai!
            </div>
          ) : (
            <div style={styles.pendingList}>
              {pending.map((attempt) => (
                <div key={attempt._id} style={styles.pendingCard}>
                  <div style={styles.pendingLeft}>
                    <h4 style={styles.pendingName}>{attempt.userId?.name || "Student"}</h4>
                    <p style={styles.pendingEmail}>{attempt.userId?.email}</p>
                    <p style={styles.pendingTest}>{attempt.testId?.title}</p>
                    <p style={styles.pendingDate}>
                      Submitted: {new Date(attempt.submittedAt).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>
                  <button
                    style={styles.scoreBtn}
                    onClick={() => openScoring(attempt)}
                  >
                    Score Now →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Results Tab */}
      {tab === "all" && (
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
      )}

      {/* Scoring Modal */}
      {selected && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Manual Scoring</h3>
                <p style={styles.modalSub}>
                  {selected.userId?.name} — {selected.testId?.title}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {selected.answers
                ?.filter((ans) => MANUAL_TYPES.includes(ans.questionType))
                .map((ans, idx) => (
                  <div key={ans.questionId} style={styles.answerBlock}>
                    <div style={styles.answerBlockHeader}>
                      <span style={styles.answerIcon}>{getModuleIcon(ans.questionType)}</span>
                      <span style={styles.answerTypeLabel}>{ans.questionType.replace(/_/g, " ").toUpperCase()}</span>
                      {ans.manualScore !== null && ans.manualScore !== undefined && (
                        <span style={styles.scoredBadge}>✓ Scored: {ans.manualScore}/9</span>
                      )}
                    </div>

                    {/* Student Response */}
                    {ans.writingResponse && (
                      <div style={styles.responseBox}>
                        <p style={styles.responseLabel}>Student ka jawab:</p>
                        <p style={styles.responseText}>{ans.writingResponse}</p>
                        <p style={styles.wordCount}>
                          Words: {ans.writingResponse.trim().split(/\s+/).filter(Boolean).length}
                        </p>
                      </div>
                    )}
                    {ans.speakingResponse && (
                      <div style={styles.responseBox}>
                        <p style={styles.responseLabel}>Speaking notes:</p>
                        <p style={styles.responseText}>{ans.speakingResponse}</p>
                      </div>
                    )}
                    {!ans.writingResponse && !ans.speakingResponse && (
                      <p style={styles.noResponse}>⚠️ Student ne koi response nahi diya</p>
                    )}

                    {/* Score Input */}
                    <div style={styles.scoreRow}>
                      <div style={styles.scoreField}>
                        <label style={styles.scoreLabel}>Band Score (1-9):</label>
                        <input
                          style={styles.scoreInput}
                          type="number"
                          min="1"
                          max="9"
                          step="0.5"
                          value={scores[ans.questionId]?.score ?? ""}
                          onChange={(e) => handleScoreChange(ans.questionId, "score", e.target.value)}
                        />
                      </div>
                      <button
                        style={saving ? styles.saveBtnDisabled : styles.saveBtn}
                        onClick={() => handleSaveScore(ans.questionId)}
                        disabled={saving || !scores[ans.questionId]?.score}
                      >
                        {saving ? "Saving..." : "Save Score"}
                      </button>
                    </div>

                    {/* Feedback */}
                    <div style={styles.feedbackField}>
                      <label style={styles.scoreLabel}>Feedback (optional):</label>
                      <textarea
                        style={styles.feedbackInput}
                        placeholder="Student ke liye feedback likhein..."
                        value={scores[ans.questionId]?.feedback ?? ""}
                        onChange={(e) => handleScoreChange(ans.questionId, "feedback", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  pendingBadge: { backgroundColor: "#fff8e1", color: "#f39c12", border: "1px solid #f39c12", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: "600" },
  tabs: { display: "flex", borderRadius: "10px", overflow: "hidden", border: "1px solid #e0e0e0", marginBottom: "20px", backgroundColor: "white", width: "fit-content" },
  activeTab: { padding: "10px 24px", backgroundColor: "#1a1a2e", color: "white", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  inactiveTab: { padding: "10px 24px", backgroundColor: "white", color: "#666", border: "none", cursor: "pointer", fontSize: "14px" },
  emptyBox: { backgroundColor: "white", borderRadius: "12px", padding: "40px", textAlign: "center", color: "#27ae60", fontSize: "16px", fontWeight: "600" },
  pendingList: { display: "flex", flexDirection: "column", gap: "12px" },
  pendingCard: { backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pendingLeft: {},
  pendingName: { margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
  pendingEmail: { margin: "0 0 4px", fontSize: "13px", color: "#888" },
  pendingTest: { margin: "0 0 4px", fontSize: "13px", color: "#3498db" },
  pendingDate: { margin: 0, fontSize: "12px", color: "#bbb" },
  scoreBtn: { padding: "10px 20px", backgroundColor: "#8e44ad", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  thead: { backgroundColor: "#1a1a2e", color: "white" },
  th: { padding: "12px 15px", textAlign: "left" },
  td: { padding: "12px 15px" },
  row: { borderBottom: "1px solid #eee" },
  band: { padding: "4px 10px", borderRadius: "20px", color: "white", fontWeight: "bold", fontSize: "12px" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal: { backgroundColor: "white", borderRadius: "16px", width: "90%", maxWidth: "680px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "20px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "#1a1a2e", color: "white" },
  modalTitle: { margin: "0 0 4px", fontSize: "18px" },
  modalSub: { margin: 0, fontSize: "13px", color: "#aaa" },
  closeBtn: { backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "16px" },
  modalBody: { padding: "20px 24px", overflowY: "auto", flex: 1 },
  answerBlock: { border: "1px solid #e0e0e0", borderRadius: "10px", padding: "16px", marginBottom: "16px" },
  answerBlockHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  answerIcon: { fontSize: "20px" },
  answerTypeLabel: { fontSize: "12px", fontWeight: "700", color: "#8e44ad", backgroundColor: "#f3e5f5", padding: "3px 10px", borderRadius: "6px" },
  scoredBadge: { fontSize: "12px", color: "#27ae60", backgroundColor: "#e8f5e9", padding: "3px 10px", borderRadius: "6px", marginLeft: "auto" },
  responseBox: { backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "14px", marginBottom: "14px" },
  responseLabel: { margin: "0 0 6px", fontSize: "12px", fontWeight: "600", color: "#888" },
  responseText: { margin: 0, fontSize: "14px", color: "#333", lineHeight: "1.6", whiteSpace: "pre-line" },
  wordCount: { margin: "6px 0 0", fontSize: "11px", color: "#aaa" },
  noResponse: { color: "#e74c3c", fontSize: "13px", marginBottom: "12px" },
  scoreRow: { display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "12px" },
  scoreField: { display: "flex", flexDirection: "column", gap: "6px" },
  scoreLabel: { fontSize: "13px", fontWeight: "600", color: "#444" },
  scoreInput: { width: "80px", padding: "8px 12px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "16px", fontWeight: "700", textAlign: "center", outline: "none" },
  saveBtn: { padding: "9px 20px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  saveBtnDisabled: { padding: "9px 20px", backgroundColor: "#999", color: "white", border: "none", borderRadius: "8px", cursor: "not-allowed", fontSize: "13px" },
  feedbackField: { display: "flex", flexDirection: "column", gap: "6px" },
  feedbackInput: { width: "100%", padding: "10px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", resize: "vertical", boxSizing: "border-box", outline: "none" },
};