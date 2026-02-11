import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";

type Question = {
  statement: string;
  answer: boolean;
};

type LeaderboardEntry = {
  username: string;
  score: number;
};

export default function GamesPage() {
  const user = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchNotesAndGenerateQuestions = async () => {
      if (!user) return;

      const { data: notes } = await supabase
        .from("notes")
        .select("content")
        .eq("user_id", user.id);

      const text = notes?.map((n) => n.content).join("\n\n") || "";

      const { data, error } = await supabase.functions.invoke(
        "generate_true_false",
        { body: { text } }
      );

      if (!error && data?.questions) {
        setQuestions(data.questions);
      }
    };

    fetchNotesAndGenerateQuestions();
  }, [user]);

  const handleAnswer = (value: boolean) => {
    const correct = questions[index]?.answer === value;

    if (correct) {
      setFeedback("✅ Correct!");
      setScore((s) => s + 1);
    } else {
      setFeedback("❌ Incorrect.");
    }

    setTimeout(() => {
      setFeedback("");
      setIndex((i) => (i + 1) % questions.length);
    }, 800);
  };

  const submitScore = async () => {
    if (!user) return;

    await supabase.from("leaderboard").insert({
      user_id: user.id,
      username: user.user_metadata?.name || "Anonymous",
      score,
    });

    fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("leaderboard")
      .select("username, score")
      .order("score", { ascending: false })
      .limit(10);

    setLeaderboard(data || []);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (!questions.length)
    return <div className="p-10 text-center">Loading game…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-6">True or False Showdown</h1>

      <div className="bg-white shadow rounded p-6 text-xl mb-6">
        {questions[index]?.statement}
      </div>

      <div className="flex justify-center gap-6 mb-4">
        <button onClick={() => handleAnswer(true)}>True</button>
        <button onClick={() => handleAnswer(false)}>False</button>
      </div>

      {feedback && <div className="mb-4">{feedback}</div>}
      <div className="mb-6">Score: {score}</div>

      <button onClick={submitScore}>Submit Score</button>

      <h2 className="mt-10 mb-4">🏆 Leaderboard</h2>
      <ol>
        {leaderboard.map((e, i) => (
          <li key={i}>
            {e.username}: {e.score}
          </li>
        ))}
      </ol>
    </div>
  );
}
