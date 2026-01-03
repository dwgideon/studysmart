import { useStudyStore } from "../store/useStudyStore";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

export default function InteractiveQuiz() {
  const { files } = useStudyStore();
  const activeFile = files.find((file) => file.active);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (activeFile) {
      const lines = activeFile.extractedText?.split("\n").filter(Boolean) || [];
      const parsed = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\d+\./)) {
          const question = lines[i];
          const options = lines.slice(i + 1, i + 5);
          const correct = options.find((o) => o.includes("*"));
          parsed.push({
            question,
            options: options.map((o) => o.replace("*", "").trim()),
            correct: correct ? correct.replace("*", "").trim() : null,
          });
        }
      }
      setQuestions(parsed);
    }
  }, [activeFile]);

  const handleAnswer = (option) => {
    const currentQ = questions[current];
    const isCorrect = option === currentQ.correct;
    setScore((prev) => prev + (isCorrect ? 1 : 0));
    setAnswers([
      ...answers,
      { ...currentQ, selected: option, correct: currentQ.correct, isCorrect },
    ]);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setShowSummary(true);
    }
  };

  if (!activeFile) return <Layout><p>Please select or upload a file.</p></Layout>;
  if (!questions.length) return <Layout><p>No quiz questions found in this file.</p></Layout>;

  if (showSummary) {
    return (
      <Layout>
        <h2>Quiz Complete 🧠</h2>
        <p>Your Score: {score} / {questions.length}</p>
        <ul>
          {answers.map((ans, idx) => (
            <li key={idx} style={{ marginBottom: "1rem" }}>
              <strong>{ans.question}</strong>
              <div>✅ Correct: {ans.correct}</div>
              <div>📝 Your Answer: {ans.selected}</div>
              <div style={{ color: ans.isCorrect ? "green" : "red" }}>
                {ans.isCorrect ? "Correct ✔️" : "Incorrect ❌"}
              </div>
            </li>
          ))}
        </ul>
        <button onClick={() => { setCurrent(0); setAnswers([]); setScore(0); setShowSummary(false); }}>
          🔁 Retake Quiz
        </button>
      </Layout>
    );
  }

  const currentQ = questions[current];
  const progress = Math.round(((current + 1) / questions.length) * 100);

  return (
    <Layout>
      <div style={{ width: "100%", background: "#eee", height: "10px", marginBottom: "1rem" }}>
        <div style={{ width: `${progress}%`, background: "#34a853", height: "100%" }} />
      </div>
      <h3>{currentQ.question}</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {currentQ.options.map((option, idx) => (
          <li key={idx} style={{ marginBottom: "0.5rem" }}>
            <button onClick={() => handleAnswer(option)} style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              textAlign: "left",
              background: "#fff",
              cursor: "pointer",
              fontSize: "16px"
            }}>
              {option}
            </button>
          </li>
        ))}
      </ul>
    </Layout>
  );
}

