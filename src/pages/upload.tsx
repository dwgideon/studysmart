import { useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Upload.module.css";

export default function UploadPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!notes && !file) {
      setError("Please paste notes or upload a file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      if (notes) formData.append("notes", notes);
      if (file) formData.append("file", file);

      const res = await fetch("/api/processMaterials", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      router.push(`/results?sessionId=${data.sessionId}`);
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
          Paste notes, lesson text, or upload a file to generate flashcards and quizzes.
        </p>

        {/* File Upload */}
        <label className={styles.fileLabel}>
          Upload a file
          <input
            type="file"
            className={styles.fileInput}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <div className={styles.or}>OR</div>

        {/* Notes */}
        <textarea
          className={styles.textarea}
          placeholder="Paste notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Flashcards & Quizzes"}
        </button>
      </div>
    </div>
  );
}
