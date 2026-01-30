// src/pages/results.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "./Results.module.css";

export default function ResultsPage() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    async function load() {
      const res = await fetch(`/api/getFlashcards?sessionId=${sessionId}`);
      const json = await res.json();
      setFlashcards(json.flashcards || []);
      setLoading(false);
    }

    load();
  }, [sessionId]);

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <h1>Your Flashcards</h1>

      {flashcards.length === 0 ? (
        <p>No flashcards generated yet.</p>
      ) : (
        <button
          className={styles.button}
          onClick={() =>
            router.push(`/flashcards?sessionId=${sessionId}`)
          }
        >
          View Flashcards
        </button>
      )}
    </div>
  );
}
