import { useEffect } from "react";
import { useRouter } from "next/router";

type QuizQuestion = {
  id: string;
  question: string;
  answer: string;
  userAnswer?: string;
};

export default function QuizResultsPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ✅ Explicit typing fixes the TS7034 error
    const incorrect: QuizQuestion[] = []; // replace with real results later

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
