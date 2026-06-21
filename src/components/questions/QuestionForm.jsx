import { useState } from "react";
import API from "../../services/api";

/**
 * QuestionForm
 * Dynamic add/edit form for a single question, fields change based on `module`.
 *
 * Props:
 *  - testId        : string (required) - the parent Test's _id
 *  - module         : "reading" | "listening" | "writing" | "speaking" (required)
 *  - questionToEdit : question object (null = add mode, object = edit mode)
 *  - onSuccess      : () => void  - called after successful save (use it to refetch + close form)
 *  - onCancel       : () => void  - called when user clicks Cancel
 */
export default function QuestionForm({ testId, module, questionToEdit, onSuccess, onCancel }) {
  const isEdit = Boolean(questionToEdit);

  const moduleTypeOptions = {
    reading: ["mcq", "true_false_not_given", "matching_headings", "fill_blank", "short_answer"],
    listening: ["short_answer", "fill_blank", "mcq", "matching_headings"],
    writing: ["writing_task1", "writing_task2"],
    speaking: ["speaking_part1", "speaking_part2_cue_card", "speaking_part3"],
  };

  const [questionType, setQuestionType] = useState(
    questionToEdit?.questionType || moduleTypeOptions[module][0]
  );
  const [question, setQuestion] = useState(questionToEdit?.question || "");
  const [marks, setMarks] = useState(questionToEdit?.marks ?? 1);
  const [order, setOrder] = useState(questionToEdit?.order ?? 1);

  // reading / listening
  const [passage, setPassage] = useState(questionToEdit?.passage || "");
  const [audioUrl, setAudioUrl] = useState(questionToEdit?.audioUrl || "");
  const [options, setOptions] = useState(
    questionToEdit?.options?.length ? questionToEdit.options : ["", ""]
  );
  const [answer, setAnswer] = useState(questionToEdit?.answer || "");

  // writing
  const [imageUrl, setImageUrl] = useState(questionToEdit?.imageUrl || "");
  const [wordLimit, setWordLimit] = useState(questionToEdit?.wordLimit ?? 250);

  // speaking
  const [cueCardPoints, setCueCardPoints] = useState(
    questionToEdit?.cueCardPoints?.length ? questionToEdit.cueCardPoints.join("\n") : ""
  );
  const [prepTimeSeconds, setPrepTimeSeconds] = useState(
    questionToEdit?.prepTimeSeconds ?? 60
  );
  const [speakingTimeSeconds, setSpeakingTimeSeconds] = useState(
    questionToEdit?.speakingTimeSeconds ?? 120
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const showsOptions = ["mcq", "matching_headings"].includes(questionType);
  const isWritingTask1 = module === "writing" && questionType === "writing_task1";
  const isSpeakingPart2 = module === "speaking" && questionType === "speaking_part2_cue_card";

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => setOptions([...options, ""]);

  const removeOption = (index) => {
    if (options.length <= 2) return; // keep at least 2
    setOptions(options.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!question.trim()) return "Question / prompt is required.";
    if ((module === "reading" || module === "listening") && showsOptions) {
      if (options.some((opt) => !opt.trim())) return "All option fields must be filled.";
      if (!answer.trim()) return "Answer is required.";
    }
    if (module === "listening" && !audioUrl.trim()) return "Audio URL is required for listening.";
    return "";
  };

  const buildPayload = () => {
    const base = {
      module,
      questionType,
      question: question.trim(),
      marks: Number(marks),
      order: Number(order),
    };

    if (module === "reading") {
      return {
        ...base,
        passage,
        ...(showsOptions ? { options: options.map((o) => o.trim()) } : {}),
        answer,
      };
    }

    if (module === "listening") {
      return {
        ...base,
        audioUrl,
        ...(showsOptions ? { options: options.map((o) => o.trim()) } : {}),
        answer,
      };
    }

    if (module === "writing") {
      return {
        ...base,
        wordLimit: Number(wordLimit),
        ...(isWritingTask1 ? { imageUrl } : {}),
      };
    }

    if (module === "speaking") {
      return {
        ...base,
        prepTimeSeconds: Number(prepTimeSeconds),
        speakingTimeSeconds: Number(speakingTimeSeconds),
        ...(isSpeakingPart2
          ? {
              cueCardPoints: cueCardPoints
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean),
            }
          : {}),
      };
    }

    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await API.put(`/tests/${testId}/questions/${questionToEdit._id}`, payload);
      } else {
        await API.post(`/tests/${testId}/questions`, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong while saving the question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h3 style={styles.heading}>
          {isEdit ? "Edit Question" : "Add Question"} — {module[0].toUpperCase() + module.slice(1)}
        </h3>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Question Type</label>
        <select
          style={styles.input}
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
        >
          {moduleTypeOptions[module].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label style={styles.label}>
          {module === "writing" ? "Prompt" : module === "speaking" ? "Topic / Question" : "Question"}
        </label>
        <textarea
          style={{ ...styles.input, minHeight: 70 }}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the question text..."
        />

        {module === "reading" && (
          <>
            <label style={styles.label}>Passage</label>
            <textarea
              style={{ ...styles.input, minHeight: 120 }}
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder="Paste the reading passage..."
            />
          </>
        )}

        {module === "listening" && (
          <>
            <label style={styles.label}>Audio URL</label>
            <input
              style={styles.input}
              type="text"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://..."
            />
          </>
        )}

        {(module === "reading" || module === "listening") && showsOptions && (
          <>
            <label style={styles.label}>Options</label>
            {options.map((opt, idx) => (
              <div key={idx} style={styles.optionRow}>
                <input
                  style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  type="button"
                  style={styles.smallBtnDanger}
                  onClick={() => removeOption(idx)}
                  disabled={options.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" style={styles.smallBtn} onClick={addOption}>
              + Add Option
            </button>
          </>
        )}

        {(module === "reading" || module === "listening") && (
          <>
            <label style={styles.label}>Answer</label>
            <input
              style={styles.input}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Correct answer"
            />
          </>
        )}

        {module === "writing" && (
          <>
            {isWritingTask1 && (
              <>
                <label style={styles.label}>Image URL (Task 1 chart/diagram)</label>
                <input
                  style={styles.input}
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </>
            )}
            <label style={styles.label}>Word Limit</label>
            <input
              style={styles.input}
              type="number"
              value={wordLimit}
              onChange={(e) => setWordLimit(e.target.value)}
            />
          </>
        )}

        {module === "speaking" && (
          <>
            {isSpeakingPart2 && (
              <>
                <label style={styles.label}>Cue Card Points (one per line)</label>
                <textarea
                  style={{ ...styles.input, minHeight: 100 }}
                  value={cueCardPoints}
                  onChange={(e) => setCueCardPoints(e.target.value)}
                  placeholder={"You should say:\nwhat it is\nwhen it happened\nwhy it matters"}
                />
              </>
            )}
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Prep Time (sec)</label>
                <input
                  style={styles.input}
                  type="number"
                  value={prepTimeSeconds}
                  onChange={(e) => setPrepTimeSeconds(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Speaking Time (sec)</label>
                <input
                  style={styles.input}
                  type="number"
                  value={speakingTimeSeconds}
                  onChange={(e) => setSpeakingTimeSeconds(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Marks</label>
            <input
              style={styles.input}
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Order</label>
            <input
              style={styles.input}
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Question" : "Add Question"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    overflowY: "auto",
    zIndex: 1000,
  },
  card: {
    background: "#fff",
    borderRadius: 10,
    padding: 24,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
  },
  heading: {
    margin: "0 0 16px 0",
    fontSize: 18,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #d0d0d0",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 4,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  optionRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  row: {
    display: "flex",
    gap: 12,
  },
  smallBtn: {
    marginTop: 6,
    padding: "6px 12px",
    fontSize: 13,
    border: "1px solid #2563eb",
    background: "#fff",
    color: "#2563eb",
    borderRadius: 6,
    cursor: "pointer",
  },
  smallBtnDanger: {
    padding: "6px 10px",
    fontSize: 13,
    border: "1px solid #dc2626",
    background: "#fff",
    color: "#dc2626",
    borderRadius: 6,
    cursor: "pointer",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    padding: "9px 16px",
    border: "1px solid #ccc",
    background: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  saveBtn: {
    padding: "9px 16px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
};
