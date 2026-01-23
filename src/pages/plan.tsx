import { useState } from "react";
import Layout from "../components/Layout";
import { useStudyStore } from "../store/useStudyStore";

export default function StudyPlanPage() {
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { files } = useStudyStore();
  const activeFile = files.find((file) => file.active);

  const handleGeneratePlan = async () => {
    if (!topic || !date) {
      setError("Please enter a topic and a test date.");
      return;
    }

    setError("");
    setLoading(true);

    const content = activeFile?.extractedText || "";
    const prompt = `
You are an expert educational coach. Create a detailed 5-day study plan for a student preparing for a test on "${topic}" by ${date}.
Use the content provided below as the basis. Divide the study plan into manageable chunks (Day 1–Day 5).
Each day should include 2-3 activities (e.g., review flashcards, take quiz, read section, reflect).
Make it motivational and easy to follow.

Study Material:
${content || "No content provided. Focus on general learning goals for the topic."}
`;

    try {
      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");

      setPlan(data.plan);
    } catch (err) {
      console.error(err);
      setError("Failed to generate study plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: "700px", margin: "auto", padding: "2rem" }}>
        <h1>📅 AI-Powered Study Plan</h1>
        <p>Enter your topic and test date, and we’ll generate a day-by-day plan just for you.</p>

        <input
          type="text"
          placeholder="Enter topic (e.g., WWII, Algebra)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #ccc" }}
        />

        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "none",
            background: "#1a73e8",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Generating..." : "✨ Generate My Study Plan"}
        </button>

        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

        {plan && (
          <div
            style={{
              marginTop: "2rem",
              whiteSpace: "pre-wrap",
              background: "#f9f9f9",
              padding: "1.5rem",
              borderRadius: "8px",
            }}
          >
            {plan}
          </div>
        )}
      </div>
    </Layout>
  );
}
