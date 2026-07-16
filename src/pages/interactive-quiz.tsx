import { useState } from "react";
import { useRouter } from "next/router";
import RequireAuth from "../components/RequireAuth";
import { useXP } from "../hooks/useXP";

type QuizQuestion = {
  conceptId?: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
};

export default function InteractiveQuiz() {
  return (
    <RequireAuth>
      <InteractiveQuizContent />
    </RequireAuth>
  );
}

function InteractiveQuizContent() {
  const router = useRouter();
  const { addXP } = useXP();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  async function generate() {
    if (!content.trim()) {return;}
    setLoading(true);
    setDone(false);
    setIndex(0);
    setScore(0);
    setAnswers({});
    setError("");

    const res = await fetch("/api/generateQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        title: content.slice(0, 48),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 423 && data.code === "LEARNING_LOCKED") {
        await router.push("/safety-lock");
        return;
      }
      setError(data.error ?? "Failed to generate quiz");
      return;
    }

    setQuestions(data.questions ?? []);
  }

  function pick(letter: string) {
    if (selected) {return;}
    setSelected(letter);
    setAnswers((a) => ({ ...a, [index]: letter }));

    const q = questions[index];
    if (letter === q.answer) {setScore((s) => s + 1);}

    setTimeout(() => {
      setSelected(null);
      if (index + 1 < questions.length) {setIndex((i) => i + 1);}
      else {finish({ index, letter });}
    }, 800);
  }

  async function finish(last?: { index: number; letter: string }) {
    const allAnswers = last
      ? { ...answers, [last.index]: last.letter }
      : answers;
    const finalScore = questions.filter(
      (q, i) => allAnswers[i] === q.answer
    ).length;
    setScore(finalScore);
    setDone(true);
    await fetch("/api/saveQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: content.slice(0, 48) || "Interactive quiz",
        source: "interactive",
        questions,
        answers: allAnswers,
      }),
    });
    await addXP(0);
  }

  if (!questions.length) {
    return (
      <Shell>
        <h1>Interactive quiz</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
          Paste notes or a topic. StudySmart builds a multiple-choice quiz for you.
        </p>
        <label style={{ display: "grid", gap: 6 }}>
          Study material or topic
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste study material here…"
            style={{
              width: "100%",
              minHeight: 160,
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
        </label>
        {error && <p role="alert" style={{ color: "#fca5a5" }}>{error}</p>}
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          style={primaryBtn}
        >
          {loading ? "Generating…" : "Generate quiz"}
        </button>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <h1>Quiz complete</h1>
        <p style={{ fontSize: 20 }}>
          Score: {score} / {questions.length}
        </p>
        <button type="button" style={primaryBtn} onClick={() => setQuestions([])}>
          Create another quiz
        </button>
      </Shell>
    );
  }

  const q = questions[index];

  return (
    <Shell>
      <p>
        Question {index + 1} / {questions.length}
      </p>
      <h2 style={{ margin: "12px 0 20px" }}>{q.question}</h2>
      {(["A", "B", "C", "D"] as const).map((letter) => {
        const text = q.options[letter];
        if (!text) {return null;}
        const isCorrect = letter === q.answer;
        const isSelected = letter === selected;
        let bg = "#f1f5f9";
        if (selected) {
          if (isCorrect) {bg = "#22c55e";}
          else if (isSelected) {bg = "#ef4444";}
        }
        return (
          <button
            key={letter}
            type="button"
            disabled={!!selected}
            onClick={() => pick(letter)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              marginBottom: 8,
              padding: 14,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: bg,
              color: selected && (isCorrect || isSelected) ? "#fff" : "#111",
            }}
          >
            <strong>{letter}.</strong> {text}
          </button>
        );
      })}
      {selected && (
        <p style={{ marginTop: 16, color: "#64748b", fontSize: 14 }}>
          {q.explanation}
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      {children}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "12px 20px",
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};
