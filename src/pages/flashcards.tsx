import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import styles from "@/styles/Flashcards.module.css";

type Flashcard = {
  front: string;
  back: string;
};

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/getNotes");
      const json: { flashcards?: Flashcard[] } = await res.json();
      setCards(json.flashcards ?? []);
    }
    load();
  }, []);

  if (cards.length === 0) {
    return (
      <AppLayout>
        <p>No flashcards available.</p>
      </AppLayout>
    );
  }

  const card = cards[index];

  return (
    <AppLayout>
      <div className={styles.card} onClick={() => setShowBack(!showBack)}>
        {showBack ? card.back : card.front}
      </div>

      <div className={styles.controls}>
        <button
          onClick={() => {
            setIndex((i) => Math.max(i - 1, 0));
            setShowBack(false);
          }}
        >
          Prev
        </button>

        <button
          onClick={() => {
            setIndex((i) => Math.min(i + 1, cards.length - 1));
            setShowBack(false);
          }}
        >
          Next
        </button>
      </div>
    </AppLayout>
  );
}
