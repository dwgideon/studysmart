import { useEffect, useState } from "react";
import Link from "next/link";

import layout from "../styles/layout.module.css";
import styles from "../styles/Results.module.css";

/* ---------- Types ---------- */

type Flashcard = {
  question: string;
  answer: string;
};

type QuizQuestion = {
  question: string;
  answer: string;
  choices: string[];
  explanation?: string;
};

type Materials = {
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  summary: string;
  studyGuide: string[];
};

/* ---------- Component ---------- */

export default function ResultsPage() {
  const [materials, setMaterials] = useState<Materials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"flashcards" | "quiz" | "summary" | "guide">(
    "flashcards"
  );

  /* Flashcards */
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  /* Quiz */
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  /* ---------- Load Materials ---------- */

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/getNotes");
        if (!res.ok) throw new Error("Failed to load materials");

        const data = await res.json();
        setMaterials(data);
      } catch (err) {
        console.error(err);
        setError("Could not load your study materials.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p className={styles.loading}>Preparing your study session…</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!materials) return null;

  const { flashcards, quizQuestions, summary, studyGuide } = materials;

  /* ---------- Flashcard Flip ---------- */

  const handleFlip = () => {
    if (flipped) return;

    setFlipped(true);

    setTimeout(() => {
      setFlipped(false);
      setCardIndex((i) => (i + 1 < flashcards.length ? i + 1 : 0));
    }, 900);
  };

  /* ---------- Save Session ---------- */

  const saveSession = async (finalScore: number) => {
    try {
      await fetch("/api/saveSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: flashcards[0]?.question || "Study Session",
          score: finalScore,
          total: quizQuestions.length,
          flashcardsCount: flashcards.length,
          createdAt: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Save session failed", e);
    }
  };

  /* ---------- Render ---------- */

  return (
    <>
      <h1 className={styles.title}>Your Study Materials</h1>
      <p className={styles.subtitle}>
        Review your study guide, test yourself with the quiz, or use flashcards
        to lock it in.
      </p>

      {/* ---------- Tabs ---------- */}

      <div className={styles.tabs}>
        {(["flashcards", "quiz", "summary", "guide"] as const).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "flashcards"
              ? "Flashcards"
              : t === "quiz"
              ? "Quiz"
              : t === "summary"
              ? "Summary"
              : "Study Guide"}
          </button>
        ))}
      </div>

      {/* ---------- Content ---------- */}

      <section className={layout.card}>
        {/* FLASHCARDS */}
        {tab === "flashcards" && flashcards.length > 0 && (
          <div className={styles.flashWrap}>
            <div className={styles.flashcard} onClick={handleFlip}>
              <div
                className={`${styles.cardInner} ${
                  flipped ? styles.flipped : ""
                }`}
              >
                <div className={styles.cardFront}>
                  {flashcards[cardIndex].question}
                </div>
                <div className={styles.cardBack}>
                  {flashcards[cardIndex].answer}
                </div>
              </div>
            </div>

            <div className={styles.counter}>
              Card {cardIndex + 1} of {flashcards.length}
            </div>
          </div>
        )}

        {/* QUIZ — STEP BY STEP */}
        {tab === "quiz" && quizQuestions.length > 0 && (
          <div className={styles.quizStep}>
            {!finished ? (
              <>
                <div className={styles.quizProgress}>
                  Question {currentQ + 1} of {quizQuestions.length}
                </div>

                <p className={styles.quizQ}>
                  {quizQuestions[currentQ].question}
                </p>

                <ul className={styles.choices}>
                  {quizQuestions[currentQ].choices.map((c, j) => (
                    <li key={j}>
                      <label
                        className={`${selected === c ? styles.selected : ""}`}
                      >
                        <input
                          type="radio"
                          name="quiz"
                          checked={selected === c}
                          onChange={() => setSelected(c)}
                        />{" "}
                        {c}
                      </label>
                    </li>
                  ))}
                </ul>

                {showAnswer && (
                  <div className={styles.feedback}>
                    {selected === quizQuestions[currentQ].answer ? (
                      <div className={styles.correct}>✅ Correct!</div>
                    ) : (
                      <div className={styles.incorrect}>
                        ❌ Correct answer: {quizQuestions[currentQ].answer}
                      </div>
                    )}

                    {quizQuestions[currentQ].explanation && (
                      <p className={styles.explanation}>
                        {quizQuestions[currentQ].explanation}
                      </p>
                    )}
                  </div>
                )}

                {!showAnswer ? (
                  <button
                    className={styles.primaryBtn}
                    disabled={!selected}
                    onClick={() => {
                      if (selected === quizQuestions[currentQ].answer) {
                        setScore((s) => s + 1);
                      }
                      setShowAnswer(true);
                    }}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    className={styles.primaryBtn}
                    onClick={() => {
                      setShowAnswer(false);
                      setSelected(null);

                      if (currentQ + 1 < quizQuestions.length) {
                        setCurrentQ((q) => q + 1);
                      } else {
                        const finalScore =
                          score +
                          (selected === quizQuestions[currentQ].answer ? 1 : 0);

                        setFinished(true);
                        saveSession(finalScore);
                      }
                    }}
                  >
                    Next Question →
                  </button>
                )}
              </>
            ) : (
              <div className={styles.scoreWrap}>
                <h3 className={styles.scoreTitle}>Quiz Complete 🎉</h3>
                <p className={styles.scoreText}>
                  You scored {score} out of {quizQuestions.length}
                </p>

                <button
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setFinished(false);
                    setScore(0);
                    setCurrentQ(0);
                    setSelected(null);
                    setShowAnswer(false);
                  }}
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUMMARY */}
        {tab === "summary" && (
          <div className={styles.textBlock}>
            {summary
              .split("\n")
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        )}

        {/* STUDY GUIDE — FORMATTED */}
        {tab === "guide" && (
          <div className={styles.guideBlocks}>
            {studyGuide.map((block, i) => {
              const lines = block.split("\n").filter(Boolean);
              const title = lines[0];
              const bullets = lines.slice(1);

              return (
                <div key={i} className={styles.guideBlock}>
                  <h4 className={styles.guideTitle}>{title}</h4>
                  <ul className={styles.guideList}>
                    {bullets.map((b, j) => (
                      <li key={j}>{b.replace(/^[-•]\s*/, "")}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- Actions ---------- */}

      <div className={styles.actions}>
        <Link href="/dashboard" className={styles.primaryBtn}>
          Go to Dashboard
        </Link>

        <Link href="/upload" className={styles.secondaryBtn}>
          Upload New Notes
        </Link>
      </div>
    </>
  );
}
