import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";

type Quiz = {
  question: string;
  choices: string[];
  answer: string;
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/getNotes");
        if (!res.ok) throw new Error("Failed to load quizzes");

        const data = await res.json();
        setQuizzes(data.quizQuestions || []);
      } catch (err) {
        console.error("Quiz load error:", err);
      }
    };

    load();
  }, []);

  const next = () => {
    if (!selected) return;

    if (selected === quizzes[current].answer) {
      setScore((s) => s + 1);
    }

    if (current + 1 < quizzes.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Quiz Practice</h1>

        {quizzes.length === 0 ? (
          <p>No quizzes available. Upload notes to generate quizzes first.</p>
        ) : finished ? (
          <div>
            <h2>Finished 🎉</h2>
            <p>
              You scored {score} out of {quizzes.length}
            </p>
          </div>
        ) : (
          <>
            <p>
              Question {current + 1} of {quizzes.length}
            </p>

            <h3 style={{ marginTop: "1rem" }}>
              {quizzes[current].question}
            </h3>

            <ul style={{ marginTop: "1rem" }}>
              {quizzes[current].choices.map((c, i) => (
                <li key={i} style={{ marginBottom: "0.5rem" }}>
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="quiz"
                      checked={selected === c}
                      onChange={() => setSelected(c)}
                      style={{ marginRight: "0.5rem" }}
                    />
                    {c}
                  </label>
                </li>
              ))}
            </ul>

            <button
              onClick={next}
              disabled={!selected}
              style={{
                marginTop: "1rem",
                padding: "0.6rem 1.2rem",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #5b8cff, #7c5cff)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {current + 1 === quizzes.length ? "Finish Quiz" : "Next"}
            </button>
          </>
        )}
      </section>
    </AppLayout>
  );
}
