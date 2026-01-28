import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import AppLayout from "../../components/layout/AppLayout";
import layout from "../../styles/layout.module.css";

type Topic = {
  id: string;
  title: string;
  image_url?: string;
};

export default function TopicDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [flashcards, setFlashcards] = useState("");
  const [quiz, setQuiz] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchTopic = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) setTopic(data as Topic);
      setLoading(false);
    };

    fetchTopic();
  }, [id]);

  const handleGenerate = async () => {
    if (!topic) return;

    setGenerating(true);

    try {
      const res = await fetch("/api/ai/topic-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: topic.title }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");

      setFlashcards(data.flashcards || "");
      setQuiz(data.quiz || "");
      setSummary(data.summary || "");
    } catch (err) {
      console.error("Generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <section className={layout.card}>
        {loading && <p>Loading topic...</p>}

        {!loading && !topic && <p>Topic not found.</p>}

        {!loading && topic && (
          <>
            <h1>{topic.title}</h1>

            {topic.image_url && (
              <img
                src={topic.image_url}
                alt={topic.title}
                style={{
                  width: "100%",
                  maxHeight: 360,
                  objectFit: "cover",
                  borderRadius: 12,
                  marginBottom: "1.5rem",
                }}
              />
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #5b8cff, #7c5cff)",
                color: "#fff",
                fontWeight: 600,
                marginBottom: "1.5rem",
                cursor: "pointer",
              }}
            >
              {generating ? "Generating..." : "✨ Generate Study Materials"}
            </button>

            {summary && (
              <div style={{ marginBottom: "2rem" }}>
                <h3>Study Guide</h3>
                <pre style={{ whiteSpace: "pre-wrap" }}>{summary}</pre>
              </div>
            )}

            {flashcards && (
              <div style={{ marginBottom: "2rem" }}>
                <h3>Flashcards</h3>
                <pre style={{ whiteSpace: "pre-wrap" }}>{flashcards}</pre>
              </div>
            )}

            {quiz && (
              <div style={{ marginBottom: "2rem" }}>
                <h3>Quiz</h3>
                <pre style={{ whiteSpace: "pre-wrap" }}>{quiz}</pre>
              </div>
            )}
          </>
        )}
      </section>
    </AppLayout>
  );
}
