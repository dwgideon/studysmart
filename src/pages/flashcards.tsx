import { useEffect, useState } from "react";
import AnswerFeedback from "@/components/AnswerFeedback";
import { useCardTimer } from "@/hooks/useCardTimer";
import { calculatePoints } from "@/lib/scoring";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [points, setPoints] = useState(0);

  const { seconds, start, stop } = useCardTimer();

  const currentCard = cards[index];

  // Load flashcards
  useEffect(() => {
    fetch("/api/getFlashcards")
      .then((res) => res.json())
      .then((data) => {
        setCards(data.flashcards);
        start();
      });
  }, []);

  const handleAnswer = async (correct: boolean) => {
  stop();

  // ✅ Send adaptive data to backend
  await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cardId: currentCard.id,
      correct,
      seconds,
    }),
  });

  // ✅ Points logic stays client-side
  if (correct) {
    setPoints((p) => p + calculatePoints(seconds));
  }

  setLastCorrect(correct);
  setShowFeedback(true);
};


  const nextCard = () => {
    setShowAnswer(false);
    setShowFeedback(false);
    setLastCorrect(null);
    setIndex((i) => i + 1);
    start();
  };

  if (!currentCard) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <h2 className="text-2xl font-bold">Session Complete 🎉</h2>
        <p className="mt-4 text-lg">Total Points: {points}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-16 px-4">
      <div className="text-right text-sm text-gray-500">
        ⏱ {seconds}s | ⭐ {points} pts
      </div>

      <div className="mt-6 p-6 rounded-xl shadow bg-white">
        <div className="text-xl font-semibold">
          {currentCard.question}
        </div>

        {showAnswer && (
          <div className="mt-4 text-lg text-gray-700">
            {currentCard.answer}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="px-4 py-2 rounded bg-indigo-600 text-white"
            >
              Show Answer
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAnswer(true)}
                className="px-4 py-2 rounded bg-green-600 text-white"
              >
                I Was Right
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="px-4 py-2 rounded bg-red-600 text-white"
              >
                I Missed It
              </button>
            </>
          )}
        </div>

        {showFeedback && lastCorrect !== null && (
          <AnswerFeedback
            correct={lastCorrect}
            seconds={seconds}
            correctAnswer={currentCard.answer}
          />
        )}

        {showFeedback && (
          <button
            onClick={nextCard}
            className="mt-6 w-full px-4 py-2 rounded bg-gray-800 text-white"
          >
            Next Card →
          </button>
        )}
      </div>
    </div>
  );
}
