import { useEffect, useState } from "react";
import styles from "../styles/Results.module.css";

type Flashcard = {
  question: string;
  answer: string;
};

export default function ResultsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/processMaterials");
        const json = await res.json();
        setFlashcards(Array.isArray(json.flashcards) ? json.flashcards : []);
      } catch {
        setFlashcards([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <p className={styles.loading}>Loading results…</p>;
  }

  return (
    <div className={styles.page}>
      <h1>Your Flashcards</h1>

      {flashcards.length === 0 && (
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
