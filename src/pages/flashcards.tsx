import { useEffect, useState } from "react";
import styles from "../styles/Flashcards.module.css";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/getFlashcards")
      .then((res) => res.json())
      .then((json) => {
        setCards(json.flashcards ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading flashcards…</p>;

  return (
    <div className={styles.page}>
      <h1>Flashcards</h1>

      {cards.length === 0 && <p>No flashcards yet.</p>}

      {cards.map((card) => (
        <div key={card.id} className={styles.card}>
          <strong>{card.question}</strong>
          <p>{card.answer}</p>
        </div>
      ))}
    </div>
  );
}
