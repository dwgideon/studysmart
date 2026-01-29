import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";
import styles from "../styles/Results.module.css";

type Flashcard = { question: string; answer: string };
type QuizQuestion = { question: string; answer: string; choices: string[] };

type Materials = {
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  summary: string;
  studyGuide: string[];
};

export default function ResultsPage() {
  const [materials, setMaterials] = useState<Materials | null>(null);
  const [tab, setTab] = useState<"flashcards" | "quiz" | "summary" | "guide">(
    "flashcards"
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("studyMaterials");
    if (stored) {
      const parsed = JSON.parse(stored);
      setMaterials({
        flashcards: parsed.flashcards || [],
        quizQuestions: parsed.quizQuestions || [],
        summary: parsed.summary || "",
        studyGuide: parsed.studyGuide || [],
      });
    }
  }, []);

  if (!materials) {
    return (
      <AppLayout>
        <p>Loading study materials…</p>
      </AppLayout>
    );
  }

  const { flashcards, quizQuestions, summary, studyGuide } = materials;

  return (
    <AppLayout>
      <h1 className={styles.title}>Your Study Materials</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "flashcards" ? styles.activeTab : ""}`}
          onClick={() => setTab("flashcards")}
        >
          Flashcards
        </button>
        <button
          className={`${styles.tab} ${tab === "quiz" ? styles.activeTab : ""}`}
          onClick={() => setTab("quiz")}
        >
          Quiz
        </button>
        <button
          className={`${styles.tab} ${tab === "summary" ? styles.activeTab : ""}`}
          onClick={() => setTab("summary")}
        >
          Summary
        </button>
        <button
          className={`${styles.tab} ${tab === "guide" ? styles.activeTab : ""}`}
          onClick={() => setTab("guide")}
        >
          Study Guide
        </button>
      </div>

      <section className={layout.card}>
        {tab === "summary" && <pre>{summary}</pre>}

        {tab === "guide" &&
          studyGuide.map((block, i) => (
            <pre key={i} style={{ marginBottom: "12px" }}>
              {block}
            </pre>
          ))}

        {tab === "flashcards" &&
          flashcards.map((f, i) => <FlipCard key={i} q={f.question} a={f.answer} />)}

        {tab === "quiz" &&
          quizQuestions.map((q, i) => <QuizCard key={i} q={q} />)}
      </section>

      <div className={styles.actions}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/upload">Upload More</Link>
        <Link href="/flashcards">Practice Flashcards</Link>
      </div>
    </AppLayout>
  );
}

/* ---------------- COMPONENTS ---------------- */

function FlipCard({ q, a }: { q: string; a: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        background: "linear-gradient(135deg, #0f172a, #020617)",
        padding: "22px",
        borderRadius: "18px",
        marginBottom: "14px",
        cursor: "pointer",
        color: "white",
        minHeight: "90px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        transition: "transform 0.2s",
      }}
    >
      <strong style={{ fontSize: "16px" }}>{flipped ? a : q}</strong>
      <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "10px" }}>
        Click to flip
      </div>
    </div>
  );
}

function QuizCard({ q }: { q: QuizQuestion }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      style={{
        background: "#020617",
        padding: "18px",
        borderRadius: "16px",
        marginBottom: "16px",
        color: "white",
        boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
      }}
    >
      <strong>{q.question}</strong>

      <div style={{ marginTop: "12px" }}>
        {q.choices.map((c) => {
          const isCorrect = selected && c === q.answer;
          const isWrong = selected === c && c !== q.answer;

          return (
            <button
              key={c}
              onClick={() => setSelected(c)}
              style={{
                display: "block",
                width: "100%",
                marginBottom: "8px",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: isCorrect
                  ? "#22c55e"
                  : isWrong
                  ? "#ef4444"
                  : "#1e293b",
                color: "white",
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {selected && (
        <div style={{ marginTop: "8px", opacity: 0.85 }}>
          Correct answer: {q.answer}
        </div>
      )}
    </div>
  );
}
