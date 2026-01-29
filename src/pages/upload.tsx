import { useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "../components/layout/AppLayout";
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

      if (!res.ok) throw new Error("Processing failed");

      const data = await res.json();

      // ✅ store generated materials for results page
      sessionStorage.setItem("studyMaterials", JSON.stringify(data));

      router.push("/results");
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <h1>Upload or Paste Your Notes</h1>

      <textarea
        id="notes"
        name="notes"
        className={styles.textarea}
        placeholder="Paste your notes here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.button} onClick={handleSubmit} disabled={loading}>
        {loading ? <span className={styles.spinner} /> : "Generate Study Materials"}
      </button>
    </AppLayout>
  );
}
