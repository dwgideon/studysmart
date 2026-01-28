import { useEffect, useState } from "react";
import AnswerFeedback from "@/components/AnswerFeedback";
import { useCardTimer } from "@/hooks/useCardTimer";
import { calculatePoints } from "@/lib/scoring";

import styles from "../styles/Flashcards.module.css";
import layout from "../styles/layout.module.css";

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

    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: currentCard.id,
        correct,
        seconds,
      }),
    });

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
      <div className={styles.completeWrap}>
        <h2 className={styles.completeTitle}>Session Complete 🎉</h2>
        <p className={styles.completePoints}>Total Points: {points}</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.topBar}>
        ⏱ {seconds}s&nbsp;&nbsp;•&nbsp;&nbsp;⭐ {points} pts
      </div>

      <section className={layout.card}>
        <div className={styles.question}>{currentCard.question}</div>

        {showAnswer && (
          <div className={styles.answer}>{currentCard.answer}</div>
        )}

        <div className={styles.controls}>
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className={styles.primaryBtn}
            >
              Show Answer
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAnswer(true)}
                className={styles.successBtn}
              >
                I Was Right
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className={styles.failBtn}
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
          <button onClick={nextCard} className={styles.nextBtn}>
            Next Card →
          </button>
        )}
      </section>
    </>
  );
}
