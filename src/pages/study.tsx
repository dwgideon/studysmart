import { useEffect, useState } from "react";

export default function StudyPage() {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(null);

  // --------------------------------------------------
  // Start study session
  // --------------------------------------------------
  useEffect(() => {
    async function start() {
      const res = await fetch("/api/study/start", { method: "POST" });
      const data = await res.json();

      setSessionId(data.sessionId);
      setCards(data.cards);
      setLoading(false);
    }

    start();
  }, []);

  if (loading) return <Center>Loading session…</Center>;
  if (done) return <StudyComplete sessionId={sessionId!} />;

  const card = cards[index];
  const progress = Math.round(((index + 1) / cards.length) * 100);

  async function submit(correct: boolean) {
    if (!sessionId) return;

    setLastResult(correct ? "correct" : "incorrect");

    await fetch("/api/study/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        cardId: card.id,
        correct,
      }),
    });

    setTimeout(() => {
      setLastResult(null);
      setFlipped(false);

      if (index + 1 < cards.length) {
        setIndex((i) => i + 1);
      } else {
        finish();
      }
    }, 600);
  }

  async function finish() {
    await fetch("/api/study/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    setDone(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-xl mx-auto">

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{index + 1} / {cards.length}</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          onClick={() => setFlipped(!flipped)}
          className={`relative bg-white rounded-2xl shadow-xl p-8 min-h-[200px]
            flex items-center justify-center text-center cursor-pointer
            transition-transform duration-500 ${
              flipped ? "rotate-y-180" : ""
            }`}
        >
          <p className="text-2xl font-semibold">
            {flipped ? card.answer : card.question}
          </p>
        </div>

        {/* Feedback */}
        {lastResult && (
          <div
            className={`mt-4 text-center font-bold text-lg ${
              lastResult === "correct" ? "text-green-600" : "text-red-600"
            }`}
          >
            {lastResult === "correct" ? "✔ Correct!" : "✘ Incorrect"}
          </div>
        )}

        {/* Actions */}
        {flipped && !lastResult && (
          <div className="mt-6 flex gap-4 justify-center">
            <ActionButton color="green" onClick={() => submit(true)}>
              Correct
            </ActionButton>
            <ActionButton color="red" onClick={() => submit(false)}>
              Incorrect
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* Components                                         */
/* -------------------------------------------------- */

function ActionButton({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode;
  color: "green" | "red";
  onClick: () => void;
}) {
  const base =
    "px-6 py-3 rounded-xl text-white text-lg font-semibold shadow-lg transition-transform hover:scale-105";

  const colors = {
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
  };

  return (
    <button onClick={onClick} className={`${base} ${colors[color]}`}>
      {children}
    </button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-xl">
      {children}
    </div>
  );
}

/* -------------------------------------------------- */
/* Completion Screen                                  */
/* -------------------------------------------------- */

function StudyComplete({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/study/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      setSession(data.session);
    }
    load();
  }, [sessionId]);

  if (!session) return <Center>Loading results…</Center>;

  return (
    <Center>
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">🎉 Session Complete</h1>
        <p className="text-xl">Correct: {session.correct}</p>
        <p className="text-xl">Incorrect: {session.incorrect}</p>

        <a
          href="/flashcards"
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold"
        >
          Back to Flashcards
        </a>
      </div>
    </Center>
  );
}
