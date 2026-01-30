import { useState } from "react";
import { useRouter } from "next/router";
import styles from "./Upload.module.css";

export default function UploadPage() {
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!notes && !file) return;

    setLoading(true);

    const formData = new FormData();
    if (notes) formData.append("notes", notes);
    if (file) formData.append("file", file);

    const res = await fetch("/api/processMaterials", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    router.push(`/results?sessionId=${data.sessionId}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Upload Your Study Material</h1>
        <p className={styles.subtitle}>
          Paste notes, lesson text, or upload a file
        </p>

        <textarea
          className={styles.textarea}
          placeholder="Paste notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className={styles.fileRow}>
          <input
            type="file"
            id="fileUpload"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
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
