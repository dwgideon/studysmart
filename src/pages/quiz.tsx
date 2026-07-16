import { useEffect, useRef, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import { useRouter } from "next/router";
import { useXP } from "../hooks/useXP";
import Link from "next/link";

type Question = {
  id: string;
  conceptId?: string | null;
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function QuizPage() {
  return (
    <RequireAuth>
      <QuizRunner />
    </RequireAuth>
  );
}

function QuizRunner() {
  const router = useRouter();
  const { addXP } = useXP();
  const sessionId =
    typeof router.query.sessionId === "string"
      ? router.query.sessionId
      : undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const completionSaved = useRef(false);

  useEffect(() => {
    if (!router.isReady) {return;}
    const url = sessionId
      ? `/api/quiz/start?sessionId=${sessionId}`
      : "/api/quiz/start";
    fetch(url, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        completionSaved.current = false;
        setQuestions(data.questions ?? []);
      })
      .catch(() => setError("Failed to load quiz"));
  }, [router.isReady, sessionId]);

  useEffect(() => {
    if (!done || completionSaved.current) {return;}
    completionSaved.current = true;
    void fetch("/api/saveQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Flashcard quiz",
        source: "flashcards",
        questions,
        answers,
      }),
    }).then(() => addXP(0));
  }, [addXP, answers, done, questions]);

  if (error) {
    return (
      <Center>
        <p>{error}</p>
        <Link href="/upload">Upload notes</Link>
      </Center>
    );
  }

  if (!questions.length && !done) {
    return <Center>Loading quiz…</Center>;
  }

  if (done) {
    return <QuizComplete score={score} total={questions.length} />;
  }

  const q = questions[index];

  function answer(option: string) {
    setSelected(option);
    setAnswers((current) => ({ ...current, [index]: option }));
    if (option === q.correctAnswer) {setScore((s) => s + 1);}

    setTimeout(() => {
      setSelected(null);
      if (index + 1 < questions.length) {setIndex((i) => i + 1);}
      else {setDone(true);}
    }, 700);
  }

  return (
    <div className="practice-page">
      <div
        className="practice-panel"
        style={{
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <p style={{ fontSize: 14, marginBottom: 8 }}>
          Question {index + 1} / {questions.length}
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          {q.question}
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          {q.options.map((opt) => {
            const isCorrect = opt === q.correctAnswer;
            const isSelected = opt === selected;
            let bg = "rgba(9,29,61,.85)";
            if (selected) {
              if (isCorrect) {bg = "#22c55e";}
              else if (isSelected) {bg = "#ef4444";}
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={!!selected}
                onClick={() => answer(opt)}
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderRadius: 10,
                  border: "1px solid rgba(125,211,252,.16)",
                  background: bg,
                  color: "#fff",
                  cursor: selected ? "default" : "pointer",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="practice-page"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function QuizComplete({
  score,
  total,
}: {
  score: number;
  total: number;
}) {
  return (
    <Center>
      <div className="practice-panel"
        style={{
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Quiz complete</h1>
        <p style={{ fontSize: 20, marginTop: 8 }}>
          Score: {score} / {total}
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "12px 24px",
            background: "linear-gradient(135deg,#1559e8,#168bff)",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Dashboard
        </Link>
      </div>
    </Center>
  );
}
