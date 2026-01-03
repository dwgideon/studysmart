// src/pages/index.tsx

import { useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Landing.module.css";

export default function IndexPage() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("notes");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("topic", topic);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await res.json();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          Study Smarter, Not Harder
        </h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic"
            className={styles.input}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={styles.select}
          >
            <option value="notes">Create Notes</option>
            <option value="quiz">Create Quiz</option>
          </select>

          <input
            type="file"
            onChange={(e) =>
              setFile(e.target.files ? e.target.files[0] : null)
            }
            className={styles.input}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {loading ? "Processing..." : "Generate"}
          </button>
        </form>
      </div>
    </main>
  );
}
