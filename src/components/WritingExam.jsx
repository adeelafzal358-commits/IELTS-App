import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function WritingExam() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentTask, setCurrentTask] = useState(1); // 1 = Task 1, 2 = Task 2
  
  // Tasks ka data store karne ke liye
  const [tasks, setTasks] = useState({ task1: null, task2: null });
  
  // Student ka input store karne ke liye
  const [answers, setAnswers] = useState({ task1Answer: "", task2Answer: "" });

  useEffect(() => {
    fetchWritingTasks();
  }, [testId]);

  const fetchWritingTasks = async () => {
    try {
      // Aapke database structure ke mutabik hum test ke sawaal fetch kar rahe hain
      const res = await API.get(`/tests/${testId}`);
      const questionsArray = res.data.data.questions || [];
      
      // Filter karke writing_task1 aur writing_task2 ko separate kar rahe hain
      const t1 = questionsArray.find(q => q.questionType === "writing_task1");
      const t2 = questionsArray.find(q => q.questionType === "writing_task2");
      
      setTasks({ task1: t1, task2: t2 });
    } catch (err) {
      console.log(err);
      alert("Error loading exam data");
    }
    setLoading(false);
  };

  // Har letter type karne par word count calculate karne ka function
  const countWords = (text) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const handleSubmitExam = async () => {
    if (!window.confirm("Are you sure you want to submit your Writing Test?")) return;
    try {
      // Student ke dono answers backend par save karne ke liye dispatch request
      await API.post(`/tests/${testId}/submit-writing`, {
        task1Answer: answers.task1Answer,
        task2Answer: answers.task2Answer
      });
      alert("Writing test submitted successfully!");
      navigate("/dashboard"); // Test ke baad wapas dashboard par bhej dein
    } catch (err) {
      console.log(err);
      alert("Error submitting exam");
    }
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading Exam Screen...</p>;

  // Jo task active hai, uski fields select karein
  const activePrompt = currentTask === 1 ? tasks.task1?.question : tasks.task2?.question;
  const activeAnswer = currentTask === 1 ? answers.task1Answer : answers.task2Answer;
  const wordLimit = currentTask === 1 ? "Minimum 150 words" : "Minimum 250 words";

  return (
    <div style={styles.container}>
      {/* Top Bar - Header and Navigation */}
      <div style={styles.topBar}>
        <h3>✍️ IELTS Academic Writing Exam</h3>
        <div>
          <button 
            style={{...styles.navBtn, backgroundColor: currentTask === 1 ? "#3498db" : "#7f8c8d"}}
            onClick={() => setCurrentTask(1)}
          >
            Writing Task 1
          </button>
          <button 
            style={{...styles.navBtn, backgroundColor: currentTask === 2 ? "#3498db" : "#7f8c8d", marginLeft: "10px"}}
            onClick={() => setCurrentTask(2)}
          >
            Writing Task 2
          </button>
        </div>
        <button style={styles.submitBtn} onClick={handleSubmitExam}>Submit Test</button>
      </div>

      {/* Main Split Screen Area */}
      <div style={styles.mainContent}>
        {/* Left Side: Question Sheet */}
        <div style={styles.leftPane}>
          <h4 style={{ color: "#2c3e50" }}>Writing Task {currentTask} Question</h4>
          <p style={styles.wordLimitHint}>💡 Target: {wordLimit}</p>
          <div style={styles.promptText}>
            {activePrompt || "No prompt available for this task. Please manage questions first."}
          </div>
          {currentTask === 1 && (
            <div style={styles.imagePlaceholder}>
              <p style={{ color: "#888", fontSize: "14px" }}>[ Visual Data Graph/Chart Displayed Here ]</p>
            </div>
          )}
        </div>

        {/* Right Side: Answer Sheet */}
        <div style={styles.rightPane}>
          <h4 style={{ color: "#2c3e50" }}>Type Your Answer Below</h4>
          <textarea
            style={styles.editor}
            placeholder="Start typing your response here..."
            value={activeAnswer}
            onChange={(e) => {
              if (currentTask === 1) {
                setAnswers({ ...answers, task1Answer: e.target.value });
              } else {
                setAnswers({ ...answers, task2Answer: e.target.value });
              }
            }}
          />
          {/* Real-time Word Counter element */}
          <div style={styles.counterBar}>
            Word Count: <span style={{ fontWeight: "bold", color: "#2980b9" }}>{countWords(activeAnswer)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f5f6fa", fontFamily: "sans-serif" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#1a1a2e", color: "white" },
  navBtn: { padding: "8px 16px", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  submitBtn: { padding: "10px 20px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  mainContent: { display: "flex", flex: 1, overflow: "hidden" },
  leftPane: { width: "50%", padding: "20px", borderRight: "2px solid #dcdde1", overflowY: "auto", backgroundColor: "#ffffff" },
  rightPane: { width: "50%", padding: "20px", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" },
  promptText: { fontSize: "16px", lineHeight: "1.6", color: "#333", backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px", border: "1px solid #e2e8f0" },
  wordLimitHint: { fontSize: "14px", color: "#e67e22", fontWeight: "bold", margin: "5px 0 15px 0" },
  imagePlaceholder: { marginTop: "20px", height: "200px", border: "2px dashed #ccc", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa", borderRadius: "6px" },
  editor: { flex: 1, width: "100%", padding: "15px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px", lineHeight: "1.5", resize: "none", boxSizing: "border-box", fontFamily: "inherit" },
  counterBar: { marginTop: "10px", padding: "10px", backgroundColor: "#f1f2f6", borderRadius: "4px", fontSize: "15px", textAlign: "right" }
};