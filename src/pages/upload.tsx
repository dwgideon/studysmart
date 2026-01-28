import { useState } from "react";
import { useRouter } from "next/router";

import layout from "../styles/layout.module.css";
import styles from "../styles/Upload.module.css";

export default function UploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!file && !notes.trim()) {
      setError("Please upload a file or paste your notes to continue.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (notes) formData.append("notes", notes);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      // 👉 Next phase: route to /results (quiz + study guide)
      // For now, send to dashboard or results depending on what you have ready
      router.push("/results");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>Upload or Paste Your Notes</h1>

      <p className={styles.subtitle}>
        Add your class notes and StudySmart will generate quizzes, flashcards,
        and study guides automatically.
      </p>

      <section className={layout.card}>
        {/* FILE UPLOAD */}
        <label className={styles.uploadBox}>
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <div className={styles.uploadText}>
            {file ? `📄 ${file.name}` : "Click to upload a file (PDF, image, doc)"}
          </div>
        </label>

        <div className={styles.divider}>or</div>

        {/* PASTE NOTES */}
        <textarea
          className={styles.textarea}
          placeholder="Paste your notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button
          onClick={handleSubmit}
          className={styles.primaryBtn}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Study Materials"}
        </button>
      </section>
    </>
  );
}
