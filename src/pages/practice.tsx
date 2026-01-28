import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";

type Flashcard = {
  question: string;
  answer: string;
};

export default function PracticePage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const loadPractice = async () => {
      try {
        const res = await fetch("/api/getNotes");
        if (!res.ok) throw new Error("Failed to load practice cards");

        const data = await res.json();
        setCards(data.flashcards || []);
      } catch (err) {
        console.error("Practice load error:", err);
      }
    };

    loadPractice();
  }, []);

  const nextCard = () => {
    setShowAnswer(false);
    setIndex((i) => (i + 1 < cards.length ? i + 1 : 0));
  };

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Practice Flashcards</h1>

        {cards.length === 0 ? (
          <p>No flashcards available. Upload notes to generate some first.</p>
        ) : (
          <>
            <p style={{ marginBottom: "1rem" }}>
              Card {index + 1} of {cards.length}
            </p>

            <div
              style={{
                padding: "1.5rem",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                marginBottom: "1rem",
              }}
            >
              <strong>
                {showAnswer ? cards[index].answer : cards[index].question}
              </strong>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowAnswer((s) => !s)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 10,
                  border: "none",
                  background: "#444",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {showAnswer ? "Show Question" : "Show Answer"}
              </button>

              <button
                onClick={nextCard}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #5b8cff, #7c5cff)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </section>
    </AppLayout>
  );
}
