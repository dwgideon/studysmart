// src/pages/upload.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import styles from "./Upload.module.css";

export default function UploadPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!text && !file) {
      alert("Please paste notes or upload a file.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("file", file);

    const res = await fetch("/api/processMaterials", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    setLoading(false);

    if (result.sessionId) {
      router.push(`/results?sessionId=${result.sessionId}`);
    } else {
      alert("Something went wrong generating materials.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Upload Your Study Material</h1>
        <p>Paste notes, lesson text, or upload a file</p>

        <textarea
          className={styles.textarea}
          placeholder="Paste notes here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className={styles.fileRow}>
          <label className={styles.fileLabel}>
            Upload File
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              hidden
            />
          </label>

          {file && <span className={styles.fileName}>{file.name}</span>}
        </div>

        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Flashcards & Quizzes"}
        </button>
      </div>
    </div>
  );
}
