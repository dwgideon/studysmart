import { useStudyStore } from "../store/useStudyStore";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

type QuizQuestion = {
  question: string;
  options: string[];
  correct: string | null;
};

type AnswerReview = QuizQuestion & {
  selected: string;
  isCorrect: boolean;
};

export default function InteractiveQuiz() {
  const { files } = useStudyStore();
  const activeFile = files.find((f) => f.active);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerReview[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!activeFile?.extractedText) return;

    const lines = activeFile.extractedText.split("\n").filter(Boolean);
    const parsed: QuizQuestion[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (/^\d+\./.test(lines[i])) {
        const question = lines[i];
        const options = lines.slice(i + 1, i + 5);
        const correctLine = options.find((o: string) => o.includes("*"));

        parsed.push({
          question,
          options: options.map((o: string) => o.replace("*", "").trim()),
          correct: correctLine ? correctLine.replace("*", "").trim() : null,
        });
      }
    }

    setQuestions(parsed);
  }, [activeFile]);

  const handleAnswer = (option: string) => {
    const q = questions[current];
    const isCorrect = option === q.correct;

    setScore((s) => s + (isCorrect ? 1 : 0));
    setAnswers((a) => [...a, { ...q, selected: option, isCorrect }]);

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
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
        <h2>Quiz Complete</h2>
        <p>
          Score: {score} / {questions.length}
        </p>

        <ul>
          {answers.map((a, i) => (
            <li key={i}>
              <strong>{a.question}</strong>
              <div>Correct: {a.correct}</div>
              <div>Your answer: {a.selected}</div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            setCurrent(0);
            setScore(0);
            setAnswers([]);
            setShowSummary(false);
          }}
        >
          Retake
        </button>
      </Layout>
    );
  }

  const q = questions[current];

  return (
    <Layout>
      <h3>{q.question}</h3>
      <ul>
        {q.options.map((opt, i) => (
          <li key={i}>
            <button onClick={() => handleAnswer(opt)}>{opt}</button>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
