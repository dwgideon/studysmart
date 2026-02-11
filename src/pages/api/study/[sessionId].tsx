import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export default function StudySessionPage() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const loadSession = async () => {
      const res = await fetch("/api/study/start", {
        method: "POST",
      });

      const data = await res.json();
      setCards(data.cards);
      setLoading(false);
    };

    loadSession();
  }, [sessionId]);

  const card = cards[index];

  async function handleAnswer(correct: boolean) {
    if (!card) return;

    await fetch("/api/study/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        cardId: card.id,
        correct,
      }),
    });

    setShowAnswer(false);

    if (index + 1 < cards.length) {
      setIndex(index + 1);
    } else {
      await fetch("/api/study/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      router.push("/flashcards");
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading study session…</div>;
  }

  if (!card) {
    return <div style={{ padding: 24 }}>No cards found.</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h2>
        Card {index + 1} / {cards.length}
      </h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: 24,
          borderRadius: 8,
          marginBottom: 16,
          cursor: "pointer",
        }}
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <p style={{ fontSize: 18 }}>
          {showAnswer ? card.answer : card.question}
        </p>
        <small>(Click to flip)</small>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => handleAnswer(false)}
          style={{ padding: "8px 16px" }}
        >
          Incorrect
        </button>
        <button
          onClick={() => handleAnswer(true)}
          style={{ padding: "8px 16px" }}
        >
          Correct
        </button>
      </div>
    </div>
  );
}
