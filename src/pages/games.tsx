
import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import withAuth from "../utils/withAuth";

function GamesPage() {
  const user = useUser();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch notes and generate questions
  useEffect(() => {
    const fetchNotesAndGenerateQuestions = async () => {
      const { data: notes } = await supabase
        .from("notes")
        .select("content")
        .eq("user_id", user?.id);

      const text = notes?.map(n => n.content).join("\n\n") || "";
      const { data: response } = await supabase.functions.invoke("generate_true_false", {
        body: { text },
      });

      if (response?.questions) {
        setQuestions(response.questions);
      }
    };

    if (user) fetchNotesAndGenerateQuestions();
  }, [user]);

  const handleAnswer = async (value) => {
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
    }, 1000);
  };

  const submitScore = async () => {
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
      .select("username, score, created_at")
      .order("score", { ascending: false })
      .limit(10);
    setLeaderboard(data || []);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (!questions.length) return <div className="p-10 text-center">Generating questions from your notes...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-6">True or False Showdown</h1>

      <div className="bg-white shadow rounded p-6 text-xl mb-6">
        {questions[index]?.statement}
      </div>

      <div className="flex justify-center gap-6 mb-4">
        <button onClick={() => handleAnswer(true)} className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
          True
        </button>
        <button onClick={() => handleAnswer(false)} className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600">
          False
        </button>
      </div>

      {feedback && <div className="text-lg font-semibold mb-4">{feedback}</div>}
      <div className="text-gray-600 mb-6">Score: {score}</div>

      <button onClick={submitScore} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        Submit Score
      </button>

      <h2 className="text-xl font-semibold mt-10 mb-4">🏆 Leaderboard</h2>
      <div className="bg-white shadow rounded p-4 text-left">
        <ol className="list-decimal ml-6 space-y-2">
          {leaderboard.map((entry, i) => (
            <li key={i}>
              <span className="font-medium">{entry.username}</span>: {entry.score}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default withAuth(GamesPage);

