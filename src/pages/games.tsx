import { useEffect, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import { useXP } from "../hooks/useXP";
import Link from "next/link";

type Question = { statement: string; answer: boolean };

type LeaderboardEntry = { rank: number; username: string; score: number };

export default function GamesPage() {
  return (
    <RequireAuth>
      <TrueFalseGame />
    </RequireAuth>
  );
}

function TrueFalseGame() {
  const { addXP } = useXP();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games/true-false", { method: "POST" })
      .then(async (response) => {
        const payload = await response.json();
        if (response.status === 423 && payload.code === "LEARNING_LOCKED") {
          window.location.assign("/safety-lock");
        }
        return payload;
      })
      .then((d) => {
        if (d.error) {
          setFeedback(d.error);
        } else {
          setQuestions(d.questions ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/games/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []));
  }, []);

  const handleAnswer = (value: boolean) => {
    const correct = questions[index]?.answer === value;
    const nextScore = correct ? score + 1 : score;

    if (correct) {
      setFeedback("Correct!");
      setScore(nextScore);
    } else {
      setFeedback("Incorrect.");
    }

    setTimeout(() => {
      setFeedback("");
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
      } else {
        setFinished(true);
        submitScore(nextScore);
      }
    }, 800);
  };

  const submitScore = async (finalScore: number) => {
    const res = await fetch("/api/games/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: finalScore }),
    });
    const data = await res.json();
    if (data.xpGain) {addXP(data.xpGain);}
    const lb = await fetch("/api/games/leaderboard").then((r) => r.json());
    setLeaderboard(lb.leaderboard ?? []);
  };

  if (loading) {return <Wrap>Loading game…</Wrap>;}

  if (!questions.length) {
    return (
      <Wrap>
        <p>{feedback || "Could not load questions."}</p>
        <Link href="/upload">Add flashcards first</Link>
      </Wrap>
    );
  }

  if (finished) {
    return (
      <Wrap>
        <h2>Round complete</h2>
        <p>
          Score: {score} / {questions.length}
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Play again
        </button>
        <LeaderboardList entries={leaderboard} />
      </Wrap>
    );
  }

  const q = questions[index];

  return (
    <Wrap>
      <h1>True or false</h1>
      <p>
        Question {index + 1} / {questions.length}
      </p>
      <p style={{ fontSize: 18, margin: "20px 0" }}>{q.statement}</p>
      <div aria-live="polite">
        {feedback && <p style={{ fontWeight: 600 }}>{feedback}</p>}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button type="button" onClick={() => handleAnswer(true)}>
          True
        </button>
        <button type="button" onClick={() => handleAnswer(false)}>
          False
        </button>
      </div>
      <LeaderboardList entries={leaderboard} />
    </Wrap>
  );
}

function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) {return null;}
  return (
    <div style={{ marginTop: 32 }}>
      <h3>XP leaderboard</h3>
      <ol>
        {entries.map((e) => (
          <li key={e.rank}>
            #{e.rank} {e.username} — {e.score} XP
          </li>
        ))}
      </ol>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="practice-page" style={{ maxWidth: 620 }}>
      <div className="practice-panel">{children}</div>
    </div>
  );
}
