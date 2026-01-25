import { useEffect } from "react";

type QuizQuestion = {
  id: string;
  question: string;
  answer: string;
  userAnswer?: string;
};

export default function QuizResultsPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Placeholder until real results are wired in
    const incorrect: QuizQuestion[] = [];

    const topic = "demo";
    const type = "quiz";

    localStorage.setItem("retryQuestions", JSON.stringify(incorrect));

    localStorage.setItem(
      "retryMeta",
      JSON.stringify({
        topic,
        type,
        count: incorrect.length,
      })
    );
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Quiz Results</h1>
      <p>Preparing retry options...</p>
    </div>
  );
}
