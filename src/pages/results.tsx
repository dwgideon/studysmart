import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "./Results.module.css";

export default function ResultsPage() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    fetch(`/api/getNotes?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setFlashcards(Array.isArray(data.flashcards) ? data.flashcards : []);
        setLoading(false);
      });
  }, [sessionId]);

  return (
    <div className={styles.page}>
      <h1>Your Flashcards</h1>

      {loading && <p>Loading…</p>}

      {!loading && flashcards.length === 0 && (
        <p>No flashcards generated yet.</p>
      )}

      <div className={styles.grid}>
        {flashcards.map((card, i) => (
          <div key={i} className={styles.card}>
            <strong>{card.question}</strong>
            <p>{card.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
