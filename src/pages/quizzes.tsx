import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";

type SavedQuiz = {
  id: string;
  title: string;
  source: string | null;
  score: number | null;
  total: number | null;
  createdAt: string;
};

export default function QuizzesPage() {
  return (
    <RequireAuth>
      <QuizzesList />
    </RequireAuth>
  );
}

function QuizzesList() {
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);

  useEffect(() => {
    fetch("/api/listQuizzes")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setQuizzes(data) : []))
      .catch(console.error);
  }, []);

  return (
    <div className="practice-page" style={{ maxWidth: 820 }}>
      <h1>Saved quizzes</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
        Quizzes from the tutor, interactive builder, and flashcard sets.
      </p>
      <Link
        href="/interactive-quiz"
        className="practice-button"
      >
        + New interactive quiz
      </Link>

      {quizzes.length === 0 ? (
        <p>No saved quizzes yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {quizzes.map((q) => (
            <li
              key={q.id}
              style={{
                padding: 16,
                marginBottom: 12,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
              }}
            >
              <strong>{q.title}</strong>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {q.source ?? "app"} ·{" "}
                {q.score !== null && q.total !== null
                  ? `${q.score}/${q.total}`
                  : "—"}{" "}
                · {new Date(q.createdAt).toLocaleDateString()}
              </p>
              <Link href={`/quiz-results/${q.id}`}>View →</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
