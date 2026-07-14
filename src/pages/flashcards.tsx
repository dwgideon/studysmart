import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export default function FlashcardsPage() {
  return (
    <RequireAuth>
      <FlashcardsContent />
    </RequireAuth>
  );
}

function FlashcardsContent() {
  const router = useRouter();
  const { sessionId } = router.query;
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) {return;}
    if (!sessionId || typeof sessionId !== "string") {
      setLoading(false);
      return;
    }

    fetch(`/api/getFlashcards?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        setCards(d.flashcards ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router.isReady, sessionId]);

  if (loading) {
    return <PageWrap>Loading flashcards…</PageWrap>;
  }

  if (!sessionId) {
    return (
      <PageWrap>
        <p>Missing session. Generate cards from upload first.</p>
        <Link href="/upload">Upload notes</Link>
      </PageWrap>
    );
  }

  if (!cards.length) {
    return (
      <PageWrap>
        <p>No flashcards in this session.</p>
        <Link href="/upload">Upload again</Link>
      </PageWrap>
    );
  }

  const card = cards[index];

  return (
    <PageWrap>
      <p style={{ marginBottom: 12 }}>
        Card {index + 1} of {cards.length}
      </p>
      <CardBox onClick={() => setFlipped(!flipped)}>
        <p style={{ fontSize: "1.35rem", fontWeight: 600 }}>
          {flipped ? card.answer : card.question}
        </p>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>
          Tap to flip
        </p>
      </CardBox>
      <NavRow>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setFlipped(false);
          }}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={index >= cards.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setFlipped(false);
          }}
        >
          Next
        </button>
      </NavRow>
      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href={`/study`}
          className="practice-button"
        >
          Study session
        </Link>
        <Link href={`/quiz?sessionId=${sessionId}`} className="practice-button">
          Quiz this set
        </Link>
        <Link href="/dashboard" className="practice-button">
          Dashboard
        </Link>
      </div>
    </PageWrap>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="practice-page" style={{ maxWidth: 680 }}>
      <h1 style={{ marginBottom: "1rem" }}>Your flashcards</h1>
      {children}
    </div>
  );
}

function CardBox({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        background: "radial-gradient(circle at 50% 30%, rgba(37,99,235,.32), transparent 55%), linear-gradient(145deg, rgba(13,42,85,.9), rgba(4,16,36,.96))",
        color: "#fff",
        padding: 40,
        border: "1px solid rgba(125,211,252,.2)",
        borderRadius: 24,
        boxShadow: "var(--shadow-soft)",
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      {children}
    </div>
  );
}

function NavRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 16,
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}
