import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";

type Flashcard = { question: string; answer: string };

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("studyMaterials");
    if (stored) {
      const parsed = JSON.parse(stored);
      setCards(parsed.flashcards || []);
    }
  }, []);

  return (
    <AppLayout>
      <h1>Flashcard Practice</h1>

      <section className={layout.card}>
        {cards.length === 0 && <p>No flashcards found. Upload notes first.</p>}

        {cards.map((c, i) => (
          <FlipCard key={i} q={c.question} a={c.answer} />
        ))}
      </section>
    </AppLayout>
  );
}

function FlipCard({ q, a }: { q: string; a: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        background: "linear-gradient(135deg, #020617, #0f172a)",
        padding: "24px",
        borderRadius: "20px",
        marginBottom: "14px",
        cursor: "pointer",
        color: "white",
        minHeight: "90px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      <strong>{flipped ? a : q}</strong>
      <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "10px" }}>
        Tap to flip
      </div>
    </div>
  );
}
