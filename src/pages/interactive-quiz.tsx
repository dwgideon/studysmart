import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";
import { useStudyStore } from "../store/useStudyStore";

/* ---------- Component ---------- */

export default function InteractiveQuiz() {
  const store = useStudyStore();

  // adjust if store structure changes
  const quizQuestions = (store as any).quiz || (store as any).quizQuestions || [];

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!quizQuestions || quizQuestions.length === 0) {
      console.warn("No quiz questions found in store.");
    }
  }, [quizQuestions]);

  const handleNext = () => {
    if (!selected) return;

    if (selected === quizQuestions[current].answer) {
      setScore((s) => s + 1);
    }

    if (current + 1 < quizQuestions.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Interactive Quiz</h1>

        {!quizQuestions || quizQuestions.length === 0 ? (
          <p>No quiz loaded. Please generate a study session first.</p>
        ) : finished ? (
          <div>
            <h2>Quiz Complete 🎉</h2>
            <p>
              You scored {score} out of {quizQuestions.length}
            </p>
          </div>
        ) : (
          <>
            <p>
              Question {current + 1} of {quizQuestions.length}
            </p>

            <h3 style={{ marginTop: "1rem" }}>
              {quizQuestions[current].question}
            </h3>

            <ul style={{ marginTop: "1rem" }}>
              {quizQuestions[current].options.map(
                (opt: string, i: number) => (
                  <li key={i} style={{ marginBottom: "0.5rem" }}>
                    <label style={{ cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="quiz"
                        checked={selected === opt}
                        onChange={() => setSelected(opt)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {opt}
                    </label>
                  </li>
                )
              )}
            </ul>

            <button
              onClick={handleNext}
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
              {current + 1 === quizQuestions.length
                ? "Finish Quiz"
                : "Next Question"}
            </button>
          </>
        )}
      </section>
    </AppLayout>
  );
}
