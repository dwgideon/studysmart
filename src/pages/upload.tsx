import { useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Upload.module.css";

export default function UploadPage() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError("Please paste some notes first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/processMaterials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error("Processing failed");

      const json = await res.json();

      router.push({
        pathname: "/results",
        query: { sessionId: json.sessionId },
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Upload or Paste Your Notes</h1>
      <p>Add your class notes and StudySmart will generate materials.</p>

      <textarea
        id="notes"
        name="notes"
        className={styles.textarea}
        placeholder="Paste your notes here..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.button}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? <span className={styles.spinner} /> : "Generate Study Materials"}
      </button>
    </div>
  );
}
