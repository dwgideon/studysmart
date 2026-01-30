import { useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Upload.module.css";

export default function UploadPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
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

      router.push("/results");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Upload or Paste Your Notes</h1>

        <textarea
          className={styles.textarea}
          placeholder="Paste your notes here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Processing…" : "Generate Study Material"}
        </button>

        {loading && <div className={styles.spinner} />}
      </div>
    </div>
  );
}
