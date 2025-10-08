// pages/quiz-results/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function QuizResultsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchQuiz = async () => {
      const res = await fetch(`/api/getQuizById?id=${id}`);
      const data = await res.json();
      if (res.ok) setQuiz(data);
      setLoading(false);
    };

    fetchQuiz();
  }, [id]);

  if (loading) return <Layout><p className="p-4">Loading...</p></Layout>;
  if (!quiz) return <Layout><p className="p-4 text-red-500">Quiz not found.</p></Layout>;

  const { topic, type, questions, answers, score } = quiz;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">📊 Quiz Results</h1>
        <p className="mb-6 text-gray-600">
          <strong>Topic:</strong> {topic} • <strong>Type:</strong> {type} • <strong>Score:</strong> {score}/{questions.length}
        </p>

        <div className="space-y-8">
          {questions.map((q: any, i: number) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.answer;

            return (
              <div key={i} className="p-4 border rounded">
                <p className="font-semibold mb-1">
                  {i + 1}. {q.question}
                </p>
                <p className={`mb-1 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                  {isCorrect ? "✅ Correct" : "❌ Incorrect"}
                </p>
                <p>
                  <strong>Your answer:</strong>{" "}
                  {userAnswer || <em className="text-gray-500">No answer</em>}
                </p>
                {!isCorrect && (
                  <>
                    <p>
                      <strong>Correct answer:</strong> {q.answer}
                    </p>
                    {q.explanation && (
                      <p className="text-gray-600">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {score !== questions.length && (
          <button
            className="mt-6 bg-yellow-500 text-white px-5 py-2 rounded hover:bg-yellow-600"
            onClick={() => {
              const incorrect = questions
                .map((q: any, i: number) => ({
                  ...q,
                  userAnswer: answers[i],
                }))
                .filter((q) => q.userAnswer !== q.answer)
                .sort(() => Math.random() - 0.5); // shuffle

              localStorage.setItem("retryQuestions", JSON.stringify(incorrect));
              localStorage.setItem("retryMeta", JSON.stringify({ topic, type, count: incorrect.length }));
              router.push("/quiz?mode=retry");
            }}
          >
            🔁 Retry Incorrect Questions ({questions.length - score})
          </button>
        )}
      </div>
    </Layout>
  );
}
