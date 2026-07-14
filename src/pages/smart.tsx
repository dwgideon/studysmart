import { useEffect, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import Link from "next/link";

type Card = { id: string; question: string; answer: string };

export default function SmartStudy() {
  return (
    <RequireAuth>
      <SmartStudyContent />
    </RequireAuth>
  );
}

function SmartStudyContent() {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/study/smart")
      .then((r) => r.json())
      .then((d) => {
        setCards(d.cards ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {return <Wrap>Loading smart review…</Wrap>;}
  if (!cards.length) {
    return (
      <Wrap>
        <p>No cards to review. Upload notes first.</p>
        <Link href="/upload">Go to upload</Link>
      </Wrap>
    );
  }

  const card = cards[index];

  async function record(correct: boolean, rating: 1 | 2 | 3 | 4) {
    await fetch("/api/study/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.id,
        sessionId: null,
        correct,
        rating,
        responseTimeMs: Date.now() - startedAt,
      }),
    }).catch(() => {});
  }

  function next(correct: boolean, rating: 1 | 2 | 3 | 4) {
    void record(correct, rating);
    setShow(false);
    setStartedAt(Date.now());
    setIndex((i) => (i + 1 < cards.length ? i + 1 : 0));
  }

  return (
    <Wrap>
      <p style={{ marginBottom: 8, opacity: 0.8 }}>
        Smart review · card {index + 1} of {cards.length}
      </p>
      <Box>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 16 }}>
          {card.question}
        </h2>
        {show && (
          <p style={{ fontSize: "1.1rem", color: "var(--blue-300)", marginBottom: 24 }}>
            {card.answer}
          </p>
        )}
        {!show ? (
          <button type="button" onClick={() => setShow(true)} style={btnPrimary}>
            Reveal answer
          </button>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" onClick={() => next(false, 1)} style={btnRed}>
              Again
            </button>
            <button type="button" onClick={() => next(true, 2)} style={btnPrimary}>
              Hard
            </button>
            <button type="button" onClick={() => next(true, 3)} style={btnGreen}>
              Good
            </button>
            <button type="button" onClick={() => next(true, 4)} style={btnPrimary}>
              Easy
            </button>
          </div>
        )}
      </Box>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="practice-page"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="practice-panel" style={{ maxWidth: 560, width: "100%" }}>
      {children}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  background: "linear-gradient(135deg,#1559e8,#168bff)",
  color: "#fff",
  border: "1px solid rgba(147,197,253,.28)",
  borderRadius: 12,
  fontWeight: 600,
  cursor: "pointer",
  minHeight: 44,
};

const btnGreen: React.CSSProperties = {
  ...btnPrimary,
  flex: 1,
  background: "#16a34a",
};

const btnRed: React.CSSProperties = {
  ...btnPrimary,
  flex: 1,
  background: "#dc2626",
};
