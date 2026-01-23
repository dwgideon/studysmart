import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { prisma } from "@/lib/prisma";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  wrongAnswers?: string[];
};

export default function PracticePage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const currentCard = flashcards[currentIndex];

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch("/api/study/smart");
        const data = await res.json();
        setFlashcards(data.cards || []);
      } catch (err) {
        console.error("Failed to load cards", err);
      }
    };

    fetchCards();
  }, []);

  if (!flashcards.length) {
    return (
      <Layout>
        <p>Loading flashcards...</p>
      </Layout>
    );
  }

  const choices: string[] = [
    ...(currentCard?.wrongAnswers || []),
    currentCard.answer,
  ].sort(() => 0.5 - Math.random());

  const handleAnswer = (choice: string) => {
    if (choice === currentCard.answer) setScore((s) => s + 1);

    if (currentIndex + 1 === flashcards.length) {
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (showResults) {
    return (
      <Layout>
        <h2>Practice Complete 🎉</h2>
        <p>
          Score: {score} / {flashcards.length}
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setShowResults(false);
          }}
        >
          Try Again
        </button>
      </Layout>
    );
  }

  return (
    <Layout>
      <h3>{currentCard.question}</h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {choices.map((c, idx) => (
          <li key={idx} style={{ marginBottom: "0.5rem" }}>
            <button
              onClick={() => handleAnswer(c)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
