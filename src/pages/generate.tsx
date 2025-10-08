// pages/generate.tsx
import { useState } from "react";
import Layout from "../components/Layout";
import { FlashcardViewer } from "@/components/FlashcardViewer";

export default function Generate() {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"flashcards" | "quiz">("flashcards");
  const [detail, setDetail] = useState("overview");
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[]>([]);

  const handleGenerate = async () => {
    if (!topic) {
      setError("Please enter a topic.");
      return;
    }

    setLoading(true);
    setError("");
    setFlashcards([]);

    const prompt =
      mode === "flashcards"
        ? `Create ${numQuestions} flashcards for the topic "${topic}" at a ${detail} level. Format as JSON with "front" and "back".`
        : `Create ${numQuestions} multiple-choice questions on the topic "${topic}" at a ${detail} level. Format as JSON with "question", "options", and "answer".`;

    try {
      const res = await fetch("/api/generateFlashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setFlashcards(data.flashcards);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: "2rem", maxWidth: "700px", margin: "auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>📘 Generate Study Material</h1>

        <input
          type="text"
          placeholder="Enter a topic (e.g., 10th grade WWII)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "1rem",
          }}
        />

        <div style={{ marginBottom: "1rem" }}>
          <strong>Type:</strong>
          <label style={{ marginLeft: "1rem" }}>
            <input
              type="radio"
              value="flashcards"
              checked={mode === "flashcards"}
              onChange={(e) => setMode(e.target.value as "flashcards" | "quiz")}
            />
            Flashcards
          </label>
          <label style={{ marginLeft: "1rem" }}>
            <input
              type="radio"
              value="quiz"
              checked={mode === "quiz"}
              onChange={(e) => setMode(e.target.value as "flashcards" | "quiz")}
            />
            Quiz
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <strong>Detail Level:</strong>
          <select
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            style={{
              marginLeft: "1rem",
              padding: "6px 10px",
              borderRadius: "6px",
            }}
          >
            <option value="overview">Overview</option>
            <option value="high detail">High Detail</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <strong># of Questions:</strong>
          <select
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            style={{
              marginLeft: "1rem",
              padding: "6px 10px",
              borderRadius: "6px",
            }}
          >
            {[5, 10, 15, 20, 25].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            backgroundColor: "#1a73e8",
            color: "#fff",
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          {loading ? "Generating..." : "✨ Generate"}
        </button>

        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

        {flashcards.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <FlashcardViewer flashcards={flashcards} />
          </div>
        )}
      </div>
    </Layout>
  );
}
