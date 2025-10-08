// pages/quizzes.tsx
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface Quiz {
  id: string;
  topic: string;
  type: string;
  score: number;
  createdAt: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const res = await fetch("/api/listQuizzes");
      const data = await res.json();
      setQuizzes(data.quizzes || []);
      setLoading(false);
    };

    fetchQuizzes();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">📂 My Saved Quizzes</h1>

        {loading ? (
          <p>Loading...</p>
        ) : quizzes.length === 0 ? (
          <p>You haven't saved any quizzes yet.</p>
        ) : (
          <ul className="space-y-4">
            {quizzes.map((quiz) => (
              <li
                key={quiz.id}
                className="border p-4 rounded flex items-center justify-between"
              >
                <div>
                  <h2 className="font-semibold text-lg">
                    🧠 {quiz.topic} ({quiz.type})
                  </h2>
                  <p className="text-sm text-gray-600">
                    Score: {quiz.score} • Saved:{" "}
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  href={`/retake?id=${quiz.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  🔁 Retake
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}