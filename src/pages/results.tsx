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
    fetch("/api/getNotes")
      .then((r) => r.json())
      .then(setMaterials)
      .catch(console.error);
  }, []);

  if (!materials) return <p>Loading study materials…</p>;

  const { flashcards, quizQuestions, summary, studyGuide } = materials;

  return (
    <AppLayout>
      <h1 className={styles.title}>Your Study Materials</h1>

      <div className={styles.tabs}>
        {["flashcards", "quiz", "summary", "guide"].map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ""}`}
            onClick={() => setTab(t as any)}
          >
            {t}
          </button>
        ))}
      </div>

      <section className={layout.card}>
        {tab === "summary" && <pre>{summary}</pre>}

        {tab === "guide" && (
          <div className={styles.guideBlocks}>
            {studyGuide.map((block, i) => {
              const lines = block.split("\n").filter(Boolean);
              return (
                <div key={i} className={styles.guideBlock}>
                  <h4>{lines[0]}</h4>
                  <ul>
                    {lines.slice(1).map((b, j) => (
                      <li key={j}>{b.replace(/^[-•]\s*/, "")}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {tab === "flashcards" &&
          flashcards.map((f, i) => (
            <p key={i}>
              <strong>{f.question}</strong> — {f.answer}
            </p>
          ))}

        {tab === "quiz" &&
          quizQuestions.map((q, i) => (
            <p key={i}>
              {i + 1}. {q.question}
            </p>
          ))}
      </section>

      <div className={styles.actions}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/upload">Upload More</Link>
      </div>
    </AppLayout>
  );
}
