// src/pages/generate.tsx

import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";

export default function Generate() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate materials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Generate Study Materials</h1>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your notes here..."
          style={{
            width: "100%",
            minHeight: 180,
            marginTop: "1rem",
            marginBottom: "1rem",
            padding: "0.75rem",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#0f1220",
            color: "#fff",
          }}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "0.7rem 1.25rem",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #5b8cff, #7c5cff)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {error && (
          <p style={{ marginTop: "1rem", color: "#ff6b6b" }}>{error}</p>
        )}

        {result && (
          <div style={{ marginTop: "2rem" }}>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
