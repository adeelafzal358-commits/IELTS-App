import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API = "https://ielts-backend.bonto.run/api";

export default function StudentResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/student/login"); return; }
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API}/attempts/${attemptId}`, { headers });
      setAttempt(res.data.attempt);
    } catch (err) {
      if (err.response?.status === 401) navigate("/student/login");
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (band) => {
    if (!band) return "#999";
    if (band >= 7) return "#27ae60";
    if (band >= 5) return "#f39c12";
    return "#e74c3c";
  };

  const getBandLabel = (band) => {
    if (!band) return "Pending";
    if (band >= 8) return "Expert";
    if (band >= 7) return "Good";
    if (band >= 6) return "Competent";
    if (band >= 5) return "Modest";
    return "Limited";
  };

  const getModuleIcon = (mod) => {
    return { reading: "📖", listening: "🎧", writing: "✍️", speaking: "🎤" }[mod] || "📝";
  };

  if (loading) return (
    <div style={styles.loadingPage}>Loading result...</div>
  );

  if (!attempt) return (
    <div style={styles.loadingPage}>Result nahi mila</div>
  );

  const isPending = attempt.status === "submitted";
  const isScored = attempt.status === "scored";

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/student/dashboard")}>
          ← Back
        </button>
        <h2 style={styles.headerTitle}>Test Result</h2>
        <div />
      </div>

      <div style={styles.body}>
        {/* Test Title */}
        <div style={styles.testTitleBox}>
          <h3 style={styles.testTitle}>{attempt.testId?.title || "IELTS Practice Test"}</h3>
          <p style={styles.testDate}>
            Submitted: {attempt.submittedAt
              ? new Date(attempt.submittedAt).toLocaleDateString("en-PK", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })
              : "—"}
          </p>
        </div>

        {/* Pending Notice */}
        {isPending && (
          <div style={styles.pendingCard}>
            <div style={styles.pendingIcon}>⏳</div>
            <h3 style={styles.pendingTitle}>Scoring In Progress</h3>
            <p style={styles.pendingText}>
              Tumhara test submit ho gaya hai. Writing aur Speaking sections
              manually score kiye ja rahe hain. Thodi der mein result available hoga.
            </p>
          </div>
        )}

        {/* Overall Band */}
        {isScored && (
          <div style={styles.overallCard}>
            <p style={styles.overallLabel}>Overall Band Score</p>
            <div
              style={{
                ...styles.bigBand,
                color: getBandColor(attempt.overallBand),
                borderColor: getBandColor(attempt.overallBand),
              }}
            >
              {attempt.overallBand || "—"}
            </div>
            <p style={{ ...styles.bandDesc, color: getBandColor(attempt.overallBand) }}>
              {getBandLabel(attempt.overallBand)}
            </p>
            <p style={styles.overallSub}>
              IELTS Band Scale: 1 (Non User) → 9 (Expert)
            </p>
          </div>
        )}

        {/* Module Scores */}
        <div style={styles.modulesGrid}>
          {["reading", "listening", "writing", "speaking"].map((mod) => {
            const score = attempt.moduleScores?.[mod];
            const band = score?.band;
            const isPendingModule = !band && isPending;
            const isManualPending = !band && isScored &&
              ["writing", "speaking"].includes(mod);

            return (
              <div key={mod} style={styles.moduleCard}>
                <div style={styles.moduleTop}>
                  <span style={styles.moduleIcon}>{getModuleIcon(mod)}</span>
                  <span style={styles.moduleName}>
                    {mod.charAt(0).toUpperCase() + mod.slice(1)}
                  </span>
                </div>
                <div
                  style={{
                    ...styles.moduleBand,
                    color: band ? getBandColor(band) : "#bbb",
                  }}
                >
                  {band || "—"}
                </div>
                <p style={styles.moduleLabel}>
                  {isPendingModule || isManualPending
                    ? "Manual scoring pending"
                    : band
                    ? `Band ${band} — ${getBandLabel(band)}`
                    : "No questions"}
                </p>
                {score?.raw !== null && score?.raw !== undefined && (
                  <p style={styles.rawScore}>
                    Raw: {score.raw} correct
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Answer Review */}
        {isScored && attempt.answers?.length > 0 && (
          <div style={styles.reviewSection}>
            <h3 style={styles.reviewTitle}>Answer Review</h3>
            {attempt.answers.map((ans, idx) => {
              const isAuto = ["mcq", "true_false_not_given", "matching_headings",
                "fill_blank", "short_answer"].includes(ans.questionType);
              const isManual = ["writing_task1", "writing_task2",
                "speaking_part1", "speaking_part2_cue_card",
                "speaking_part3"].includes(ans.questionType);

              return (
                <div key={idx} style={styles.answerCard}>
                  <div style={styles.answerHeader}>
                    <span style={styles.answerNum}>Q{idx + 1}</span>
                    <span style={styles.answerModule}>{ans.module}</span>
                    <span style={styles.answerType}>{ans.questionType}</span>
                    {isAuto && ans.isCorrect !== null && (
                      <span style={{
                        ...styles.correctBadge,
                        backgroundColor: ans.isCorrect ? "#e8f5e9" : "#ffeaea",
                        color: ans.isCorrect ? "#27ae60" : "#e74c3c"
                      }}>
                        {ans.isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </span>
                    )}
                    {isManual && (
                      <span style={styles.manualBadge}>
                        {ans.manualScore !== null
                          ? `Score: ${ans.manualScore}/9`
                          : "Pending Score"}
                      </span>
                    )}
                  </div>

                  {/* Student answer */}
                  {ans.selected && (
                    <div style={styles.answerRow}>
                      <span style={styles.answerRowLabel}>Your Answer:</span>
                      <span style={{ color: ans.isCorrect ? "#27ae60" : "#e74c3c" }}>
                        {ans.selected}
                      </span>
                    </div>
                  )}
                  {ans.writingResponse && (
                    <div style={styles.writingAnswer}>
                      <span style={styles.answerRowLabel}>Your Writing:</span>
                      <p style={styles.writingText}>{ans.writingResponse}</p>
                    </div>
                  )}

                  {/* Feedback */}
                  {ans.manualFeedback && (
                    <div style={styles.feedbackBox}>
                      <span style={styles.feedbackLabel}>📝 Teacher Feedback:</span>
                      <p style={styles.feedbackText}>{ans.manualFeedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actionRow}>
          <button
            style={styles.dashBtn}
            onClick={() => navigate("/student/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f0f4f8" },
  loadingPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#888" },
  header: { backgroundColor: "#1a1a2e", color: "white", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: "7px 14px", backgroundColor: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  headerTitle: { margin: 0, fontSize: "17px", fontWeight: "700" },
  body: { maxWidth: "800px", margin: "0 auto", padding: "24px 20px" },
  testTitleBox: { marginBottom: "20px" },
  testTitle: { margin: "0 0 6px", fontSize: "20px", fontWeight: "700", color: "#1a1a2e" },
  testDate: { margin: 0, fontSize: "13px", color: "#888" },
  pendingCard: { backgroundColor: "#fff8e1", border: "2px solid #f39c12", borderRadius: "14px", padding: "32px", textAlign: "center", marginBottom: "20px" },
  pendingIcon: { fontSize: "48px", marginBottom: "12px" },
  pendingTitle: { margin: "0 0 10px", fontSize: "20px", color: "#f39c12" },
  pendingText: { margin: 0, fontSize: "14px", color: "#666", lineHeight: "1.6" },
  overallCard: { backgroundColor: "white", borderRadius: "14px", padding: "32px", textAlign: "center", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  overallLabel: { margin: "0 0 12px", fontSize: "14px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" },
  bigBand: { fontSize: "80px", fontWeight: "900", lineHeight: 1, border: "4px solid", borderRadius: "50%", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  bandDesc: { margin: "0 0 8px", fontSize: "18px", fontWeight: "700" },
  overallSub: { margin: 0, fontSize: "12px", color: "#bbb" },
  modulesGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", marginBottom: "20px" },
  moduleCard: { backgroundColor: "white", borderRadius: "12px", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  moduleTop: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" },
  moduleIcon: { fontSize: "20px" },
  moduleName: { fontSize: "14px", fontWeight: "700", color: "#1a1a2e" },
  moduleBand: { fontSize: "42px", fontWeight: "900", lineHeight: 1, marginBottom: "6px" },
  moduleLabel: { margin: "0 0 4px", fontSize: "12px", color: "#888" },
  rawScore: { margin: 0, fontSize: "12px", color: "#bbb" },
  reviewSection: { backgroundColor: "white", borderRadius: "14px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  reviewTitle: { margin: "0 0 20px", fontSize: "17px", fontWeight: "700", color: "#1a1a2e" },
  answerCard: { border: "1px solid #e0e0e0", borderRadius: "10px", padding: "16px", marginBottom: "12px" },
  answerHeader: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" },
  answerNum: { backgroundColor: "#1a1a2e", color: "white", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: "700" },
  answerModule: { backgroundColor: "#f0f4f8", color: "#666", borderRadius: "6px", padding: "2px 8px", fontSize: "12px" },
  answerType: { backgroundColor: "#eef2ff", color: "#3498db", borderRadius: "6px", padding: "2px 8px", fontSize: "12px" },
  correctBadge: { borderRadius: "6px", padding: "2px 10px", fontSize: "12px", fontWeight: "600" },
  manualBadge: { backgroundColor: "#f3e5f5", color: "#8e44ad", borderRadius: "6px", padding: "2px 10px", fontSize: "12px" },
  answerRow: { display: "flex", gap: "10px", fontSize: "14px", marginBottom: "6px" },
  answerRowLabel: { fontWeight: "600", color: "#555", minWidth: "100px" },
  writingAnswer: { marginBottom: "8px" },
  writingText: { margin: "6px 0 0", fontSize: "13px", color: "#444", backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "8px", lineHeight: "1.6" },
  feedbackBox: { backgroundColor: "#f0f8ff", border: "1px solid #bee3f8", borderRadius: "8px", padding: "12px", marginTop: "8px" },
  feedbackLabel: { fontSize: "13px", fontWeight: "600", color: "#3498db" },
  feedbackText: { margin: "6px 0 0", fontSize: "13px", color: "#444", lineHeight: "1.6" },
  actionRow: { display: "flex", justifyContent: "center", marginTop: "8px" },
  dashBtn: { padding: "12px 28px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};