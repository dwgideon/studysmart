import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../utils/supabaseClient";
import Layout from "../../components/Layout";
import { postToGroq } from "../../utils/groqClient";

export default function TopicDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState("");
  const [quiz, setQuiz] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchTopic = async () => {
      const { data, error } = await supabase.from("topics").select("*").eq("id", id).single();
      if (!error) setTopic(data);
      setLoading(false);
    };
    fetchTopic();
  }, [id]);

  const handleGenerate = async () => {
    if (!topic) return;
    setGenerating(true);

    try {
      const flashcardPrompt = `Create 10 flashcards for the topic "${topic.title}". Format as "Q: question?\nA: answer."`;
      const quizPrompt = `Create a 5-question multiple choice quiz for the topic "${topic.title}". Include 4 answer options for each question and clearly mark the correct answer.`;
      const summaryPrompt = `Write a brief 3-paragraph study summary for "${topic.title}".`;

      const [flashcardResp, quizResp, summaryResp] = await Promise.all([
        postToGroq(flashcardPrompt),
        postToGroq(quizPrompt),
        postToGroq(summaryPrompt),
      ]);

      setFlashcards(flashcardResp);
      setQuiz(quizResp);
      setSummary(summaryResp);
    } catch (err) {
      console.error(err);
    }

    setGenerating(false);
  };

  if (loading) return <Layout><p>Loading topic...</p></Layout>;
  if (!topic) return <Layout><p>Topic not found.</p></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto my-10 bg-white rounded shadow p-6">
        <h1 className="text-3xl font-bold mb-4">{topic.title}</h1>
        <img src={topic.image_url} alt={topic.title} className="w-full h-96 object-cover rounded mb-6" />

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-blue-600 text-white px-6 py-3 rounded font-bold mb-6"
        >
          {generating ? "Generating..." : "✨ Generate Flashcards, Quiz & Summary"}
        </button>

        {summary && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-2">Summary</h2>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">{summary}</pre>
          </div>
        )}

        {flashcards && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-2">Flashcards</h2>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">{flashcards}</pre>
          </div>
        )}

        {quiz && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-2">Quiz</h2>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">{quiz}</pre>
          </div>
        )}
      </div>
    </Layout>
  );
}