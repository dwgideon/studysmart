import { useEffect, useState } from "react";

type Card = {
  id: string;
  question: string;
  answer: string;
};

export default function SmartStudy() {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/study/smart")
      .then((r) => r.json())
      .then((d) => setCards(d.cards));
  }, []);

  if (!cards.length) {
    return <Center>Loading Smart Study…</Center>;
  }

  const card = cards[index];

  return (
    <Center>
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">{card.question}</h2>

        {show && (
          <p className="text-lg text-indigo-700 mb-6">{card.answer}</p>
        )}

        {!show ? (
          <button
            onClick={() => setShow(true)}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg"
          >
            Reveal Answer
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => next()}
              className="flex-1 py-3 bg-red-500 text-white rounded-lg"
            >
              ❌ Missed
            </button>
            <button
              onClick={() => next()}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg"
            >
              ✅ Got It
            </button>
          </div>
        )}
      </div>
    </Center>
  );

  function next() {
    setShow(false);
    setIndex((i) => (i + 1 < cards.length ? i + 1 : 0));
  }
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50">
      {children}
    </div>
  );
}
