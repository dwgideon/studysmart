import { useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Upload.module.css";

export default function UploadPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Please paste notes or upload content.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/processMaterials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const result = await res.json();

      router.push(`/results?sessionId=${result.sessionId}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Upload Your Study Material</h1>
        <p className={styles.subtitle}>
          Paste notes, lesson text, or study material below
        </p>

        <textarea
          id="notes"
          name="notes"
          className={styles.textarea}
          placeholder="Paste notes here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            "Generate Flashcards & Quizzes"
          )}
        </button>
      </div>
    </div>
  );
}
