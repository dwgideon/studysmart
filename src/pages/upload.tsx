import { useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Upload.module.css";

export default function UploadPage() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    setError("");

    if (!file && !text.trim()) {
      setError("Please upload a file or paste your notes.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (text) formData.append("text", text);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Upload failed");
      }

      const data = await res.json();

      // you may want to store session id later
      router.push("/results");
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Upload or Paste Your Notes</h1>
      <p className={styles.subtitle}>
        Add your class notes and StudySmart will generate quizzes, flashcards,
        and study guides automatically.
      </p>

      <div className={styles.card}>
        <label className={styles.uploadBox}>
          <input type="file" hidden onChange={handleFileChange} />
          {file ? (
            <span>📄 {file.name}</span>
          ) : (
            <span>Click to upload a file</span>
          )}
        </label>

        <div className={styles.or}>or</div>

        <textarea
          className={styles.textarea}
          placeholder="Paste your notes here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinnerWrap}>
              <span className={styles.spinner} />
              Generating…
            </span>
          ) : (
            "Generate Study Materials"
          )}
        </button>
      </div>
    </div>
  );
}
