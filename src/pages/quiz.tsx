import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/quiz/start", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions));
  }, []);

  if (!questions.length) return <Center>Loading quiz…</Center>;
  if (done) return <QuizComplete score={score} total={questions.length} />;

  const q = questions[index];

  function answer(option: string) {
    setSelected(option);

    if (option === q.correctAnswer) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      setSelected(null);
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
      } else {
        setDone(true);
      }
    }, 700);
  }

  return (
    <div className="min-h-screen bg-indigo-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <p className="text-sm mb-2">
          Question {index + 1} / {questions.length}
        </p>

        <h2 className="text-2xl font-bold mb-6">{q.question}</h2>

        <div className="grid gap-4">
          {q.options.map((opt) => {
            const isCorrect = opt === q.correctAnswer;
            const isSelected = opt === selected;

            let style =
              "border p-4 rounded-lg text-left transition font-medium";

            if (selected) {
              if (isCorrect) style += " bg-green-500 text-white";
              else if (isSelected) style += " bg-red-500 text-white";
              else style += " opacity-50";
            } else {
              style += " hover:bg-indigo-100";
            }

            return (
              <button
                key={opt}
                disabled={!!selected}
                onClick={() => answer(opt)}
                className={style}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-xl">
      {children}
    </div>
  );
}

function QuizComplete({ score, total }: { score: number; total: number }) {
  return (
    <Center>
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-4">🧠 Quiz Complete</h1>
        <p className="text-xl">
          Score: {score} / {total}
        </p>

        <a
          href="/flashcards"
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg"
        >
          Back to Flashcards
        </a>
      </div>
    </Center>
  );
}
