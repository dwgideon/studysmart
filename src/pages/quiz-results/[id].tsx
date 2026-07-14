import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import RequireAuth from "../../components/RequireAuth";
import Link from "next/link";

type SavedQuiz = {
  id: string;
  title: string;
  questions: Array<{
    question: string;
    options?: Record<string, string>;
    answer: string;
    explanation?: string;
  }>;
  score: number | null;
  total: number | null;
  createdAt: string;
};

export default function QuizResultPage() {
  return (
    <RequireAuth>
      <QuizResultContent />
    </RequireAuth>
  );
}

function QuizResultContent() {
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState<SavedQuiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") {return;}

    fetch(`/api/getQuizById?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {setQuiz(null);}
        else {setQuiz(data);}
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {return <Wrap>Loading…</Wrap>;}
  if (!quiz) {return <Wrap>Quiz not found.</Wrap>;}

  return (
    <Wrap>
      <h1>{quiz.title}</h1>
      <p>
        Score: {quiz.score ?? "—"} / {quiz.total ?? quiz.questions?.length ?? "—"}
      </p>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        {new Date(quiz.createdAt).toLocaleString()}
      </p>

      <ol>
        {(quiz.questions as SavedQuiz["questions"]).map((q, i) => (
          <li key={i} style={{ marginBottom: 16 }}>
            <strong>{q.question}</strong>
            {q.explanation && (
              <p style={{ fontSize: 14, color: "#64748b" }}>{q.explanation}</p>
            )}
          </li>
        ))}
      </ol>

      <Link href="/quizzes" style={{ color: "#4f46e5" }}>
        ← All quizzes
      </Link>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      {children}
    </div>
  );
}
