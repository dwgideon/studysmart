import { useEffect, useState } from "react";
import styles from "../styles/Flashcards.module.css";

type Flashcard = {
  question: string;
  answer: string;
};

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/processMaterials");
        const json = await res.json();
        setCards(Array.isArray(json.flashcards) ? json.flashcards : []);
      } catch {
        setCards([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.page}>
      <h1>Flashcards</h1>

      <div className={styles.grid}>
        {cards.map((card, i) => (
          <div key={i} className={styles.card}>
            <h3>{card.question}</h3>
            <p>{card.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
