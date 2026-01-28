import { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function QuizStartPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const res = await fetch("/api/quiz/start");

        if (!res.ok) {
          throw new Error("Failed to load quiz");
        }

        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (err) {
        console.error(err);
        setError("Could not load quiz.");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, []);

  return (
    <AppLayout>
      <section style={{ maxWidth: 800, margin: "2rem auto" }}>
        <h1>Quiz</h1>

        {loading && <p>Loading quiz...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading &&
          !error &&
          questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: "1.5rem" }}>
              <strong>
                {i + 1}. {q.question}
              </strong>
              <ul>
                {q.options.map((opt, j) => (
                  <li key={j}>{opt}</li>
                ))}
              </ul>
            </div>
          ))}
      </section>
    </AppLayout>
  );
}
