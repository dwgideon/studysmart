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
    if (!router.isReady) return;
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(
          `/api/getFlashcards?sessionId=${sessionId}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch flashcards");
        }

        const json = await res.json();
        setFlashcards(json.flashcards || []);
      } catch (err) {
        console.error("Error loading flashcards:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router.isReady, sessionId]);

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
