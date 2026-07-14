import { useEffect, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import { useXP } from "../hooks/useXP";
import Link from "next/link";
import styles from "./Study.module.css";

type Card = { id: string; question: string; answer: string };

type SessionResult = {
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
  xpEarned?: number;
};

export default function StudyPage() {
  return (
    <RequireAuth>
      <StudySession />
    </RequireAuth>
  );
}

function StudySession() {
  const { addXP } = useXP();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    async function start() {
      const res = await fetch("/api/study/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Could not start session");
        setLoading(false);
        return;
      }
      setSessionId(data.sessionId);
      setCards(data.cards ?? []);
      setLoading(false);
    }
    start();
  }, []);

  if (loading) {return <Center>Loading session…</Center>;}
  if (!cards.length) {
    return (
      <Center>
        <p>No flashcards yet.</p>
        <Link href="/upload" style={{ color: "#6366f1" }}>
          Upload notes first
        </Link>
      </Center>
    );
  }
  if (done && result) {
    return <StudyComplete result={result} />;
  }

  const card = cards[index];
  const progress = Math.round(((index + 1) / cards.length) * 100);

  async function submit(correct: boolean, rating: 1 | 2 | 3 | 4) {
    if (!sessionId) {return;}
    setLastResult(correct ? "correct" : "incorrect");

    await fetch("/api/study/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        cardId: card.id,
        correct,
        rating,
        responseTimeMs: Date.now() - startedAt,
      }),
    });

    setTimeout(() => {
      setLastResult(null);
      setFlipped(false);
      setStartedAt(Date.now());
      if (index + 1 < cards.length) {
        setIndex((i) => i + 1);
      } else {
        finish();
      }
    }, 600);
  }

  async function finish() {
    const res = await fetch("/api/study/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (data.xpEarned) {addXP(data.xpEarned);}
    const session = data.session ?? data;
    setResult({ ...session, xpEarned: data.xpEarned });
    setDone(true);
  }

  return (
    <div className={styles.page}>
      <div className={styles.session}>
        <div className={styles.progressBlock}>
          <div className={styles.progressText}>
            <span>Progress</span>
            <span>
              {index + 1} / {cards.length}
            </span>
          </div>
          <div className={styles.progressTrack} role="progressbar" aria-label="Study progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFlipped(!flipped)}
          className={styles.card}
          aria-pressed={flipped}
          aria-label={flipped ? "Answer shown. Show question" : "Question shown. Reveal answer"}
        >
          <span className={styles.cardText}>
            {flipped ? card.answer : card.question}
          </span>
        </button>

        {lastResult && (
          <p
            className={lastResult === "correct" ? styles.correct : styles.incorrect}
            role="status"
          >
            {lastResult === "correct" ? "Correct!" : "Incorrect"}
          </p>
        )}

        {flipped && !lastResult && (
          <div className={styles.ratingActions} aria-label="Rate your recall">
            <button
              type="button"
              onClick={() => submit(false, 1)}
              className={styles.again}
            >
              Again
            </button>
            <button
              type="button"
              onClick={() => submit(true, 2)}
              className={styles.hard}
            >
              Hard
            </button>
            <button
              type="button"
              onClick={() => submit(true, 3)}
              className={styles.good}
            >
              Good
            </button>
            <button
              type="button"
              onClick={() => submit(true, 4)}
              className={styles.easy}
            >
              Easy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.center}>
      {children}
    </div>
  );
}

function StudyComplete({ result }: { result: SessionResult }) {
  return (
    <Center>
      <div className={styles.complete}>
        <h1>Session complete</h1>
        <p>Correct: {result.correct}</p>
        <p>Incorrect: {result.incorrect}</p>
        <p className={styles.secondary}>
          Accuracy: {result.accuracy}%
        </p>
        {result.xpEarned !== undefined && (
          <p className={styles.xp}>
            +{result.xpEarned} XP
          </p>
        )}
        <Link
          href="/dashboard"
          className={styles.dashboardLink}
        >
          Back to dashboard
        </Link>
      </div>
    </Center>
  );
}
