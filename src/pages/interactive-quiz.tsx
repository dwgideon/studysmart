import { useStudyStore } from "../store/useStudyStore";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

/** ---------- Types ---------- */

type QuizQuestion = {
  question: string;
  options: string[];
  correct: string | null;
};

type QuizAnswer = QuizQuestion & {
  selected: string;
  isCorrect: boolean;
};

type StudyFile = {
  id: number;
  extractedText?: string;
  active?: boolean;
};

/** ---------- Component ---------- */

export default function InteractiveQuiz() {
  const { files } = useStudyStore() as { files: StudyFile[] };

  const activeFile = files.find((file) => file.active);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  useEffect(() => {
    if (activeFile?.extractedText) {
      const lines: string[] = activeFile.extractedText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const parsed: QuizQuestion[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (/^\d+\./.test(lines[i])) {
          const question = lines[i];
          const options: string[] = lines.slice(i + 1, i + 5);
          const correct = options.find((o: string) => o.includes("*"));

          parsed.push({
            question,
            options: options.map((o: string) => o.replace("*", "").trim()),
            correct: correct ? correct.replace("*", "").trim() : null,
          });
        }
      }

      setQuestions(parsed);
    }
  }, [activeFile]);

  const handleAnswer = (option: string) => {
    const currentQ = questions[current];
    if (!currentQ) return;

    const isCorrect = option === currentQ.correct;

    setScore((prev) => prev + (isCorrect ? 1 : 0));

    setAnswers((prev) => [
      ...prev,
      {
        ...currentQ,
        selected: option,
        isCorrect,
      },
    ]);

    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  if (!activeFile)
    return (
      <Layout>
        <p>Please select or upload a file.</p>
      </Layout>
    );

  if (!questions.length)
    return (
      <Layout>
        <p>No quiz questions found in this file.</p>
      </Layout>
    );

  if (showSummary) {
    return (
      <Layout>
        <h2>Quiz Complete 🧠</h2>
        <p>
          Your Score: {score} / {questions.length}
        </p>

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

        <button
          onClick={() => {
            setCurrent(0);
            setAnswers([]);
            setScore(0);
            setShowSummary(false);
          }}
        >
          🔁 Retake Quiz
        </button>
      </Layout>
    );
  }

  const currentQ = questions[current];
  const progress = Math.round(((current + 1) / questions.length) * 100);

  return (
    <Layout>
      <div
        style={{
          width: "100%",
          background: "#eee",
          height: "10px",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            background: "#34a853",
            height: "100%",
          }}
        />
      </div>

      <h3>{currentQ.question}</h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {currentQ.options.map((option: string, idx: number) => (
          <li key={idx} style={{ marginBottom: "0.5rem" }}>
            <button
              onClick={() => handleAnswer(option)}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                width: "100%",
                textAlign: "left",
                background: "#fff",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
