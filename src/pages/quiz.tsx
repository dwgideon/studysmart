// pages/quiz.tsx
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";

export default function QuizPage() {
  const [topic, setTopic] = useState("");
  const [quizType, setQuizType] = useState("multiple-choice");
  const [numQuestions, setNumQuestions] = useState(15);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [step, setStep] = useState<"start" | "quiz" | "result">("start");
  const [score, setScore] = useState<number>(0);

  const router = useRouter();
  const isRetake = router.query.mode === "retake";
  const isRetry = router.query.mode === "retry";

  useEffect(() => {
    if (isRetake) {
      const saved = localStorage.getItem("retakeQuiz");
      if (saved) {
        const parsed = JSON.parse(saved);
        setTopic(parsed.topic);
        setQuizType(parsed.type);
        setQuestions(parsed.questions);
        setAnswers(Array(parsed.questions.length).fill(""));
        setResults(Array(parsed.questions.length).fill({ correct: false, explanation: "" }));
        setStep("quiz");
      }
    } else if (isRetry) {
      const saved = localStorage.getItem("retryQuestions");
      const meta = localStorage.getItem("retryMeta");
      if (saved && meta) {
        const parsed = JSON.parse(saved);
        const parsedMeta = JSON.parse(meta);
        setTopic(parsedMeta.topic);
        setQuizType(parsedMeta.type);
        setQuestions(parsed);
        setAnswers(Array(parsed.length).fill(""));
        setResults(Array(parsed.length).fill({ correct: false, explanation: "" }));
        setStep("quiz");
      }
    }
  }, [isRetake, isRetry]);

  const handleGenerate = async () => {
    const res = await fetch("/api/generateQuiz", {
      method: "POST",
      body: JSON.stringify({ topic, type: quizType, count: numQuestions }),
    });
    const data = await res.json();
    setQuestions(data.questions);
    setAnswers(Array(data.questions.length).fill(""));
    setResults(Array(data.questions.length).fill({ correct: false, explanation: "" }));
    setStep("quiz");
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/checkAnswers", {
      method: "POST",
      body: JSON.stringify({ questions, answers }),
    });
    const data = await res.json();
    setResults(data.results);
    setScore(data.score);
    setStep("result");

    // Only save full quizzes
    if (!isRetake && !isRetry) {
      await fetch("/api/saveQuiz", {
        method: "POST",
        body: JSON.stringify({
          topic,
          type: quizType,
          questions,
          answers,
          score: data.score,
        }),
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        {step === "start" && (
          <>
            <h1 className="text-3xl font-bold mb-6">🧠 Generate Quiz</h1>

            <div className="space-y-4">
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Topic (e.g., React Hooks)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              <select
                className="w-full p-2 border rounded"
                value={quizType}
                onChange={(e) => setQuizType(e.target.value)}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
              </select>

              <select
                className="w-full p-2 border rounded"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              >
                {[15, 30, 50, 75, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} Questions
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerate}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
              >
                Generate Quiz
              </button>
            </div>
          </>
        )}

        {step === "quiz" && (
          <>
            <h1 className="text-2xl font-bold mb-6">Quiz: {topic}</h1>

            <div className="space-y-8">
              {questions.map((q, i) => (
                <div key={i} className="border p-4 rounded">
                  <p className="font-semibold mb-2">
                    {i + 1}. {q.question}
                  </p>

                  {quizType === "multiple-choice" && (
                    <div className="space-y-1">
                      {q.options.map((opt: string) => (
                        <label key={opt} className="block">
                          <input
                            type="radio"
                            name={`q-${i}`}
                            value={opt}
                            checked={answers[i] === opt}
                            onChange={() => handleAnswerChange(i, opt)}
                          />
                          <span className="ml-2">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {quizType === "true-false" && (
                    <div>
                      {["True", "False"].map((opt) => (
                        <label key={opt} className="block">
                          <input
                            type="radio"
                            name={`q-${i}`}
                            value={opt}
                            checked={answers[i] === opt}
                            onChange={() => handleAnswerChange(i, opt)}
                          />
                          <span className="ml-2">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {quizType === "short-answer" && (
                    <input
                      type="text"
                      className="w-full p-2 border rounded mt-2"
                      value={answers[i]}
                      onChange={(e) => handleAnswerChange(i, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              className="mt-6 bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
            >
              Submit Quiz
            </button>
          </>
        )}

        {step === "result" && (
          <>
            <h1 className="text-2xl font-bold mb-4">📊 Results</h1>
            <p className="mb-6">
              You scored {score}/{questions.length}
            </p>

            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={i} className="border p-4 rounded">
                  <p className="font-semibold">
                    {i + 1}. {q.question}
                  </p>
                  <p>
                    <strong>Your answer:</strong>{" "}
                    <span
                      className={
                        results[i].correct ? "text-green-600" : "text-red-600"
                      }
                    >
                      {answers[i] || "No answer"}
                    </span>
                  </p>
                  {!results[i].correct && (
                    <>
                      <p>
                        <strong>Correct answer:</strong> {q.answer}
                      </p>
                      <p className="text-gray-600">
                        <strong>Explanation:</strong>{" "}
                        {results[i].explanation || "No explanation provided."}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/quizzes")}
              className="mt-6 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
            >
              Back to My Quizzes
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
