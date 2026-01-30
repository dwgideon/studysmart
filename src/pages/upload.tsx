import { useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import styles from "@/styles/Upload.module.css";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/processMaterials", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const result: { sessionId: string } = await res.json();
      router.push(`/results?sessionId=${result.sessionId}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        <h1>Upload Your Study Material</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Processing…" : "Upload & Generate"}
          </button>
        </form>

        {loading && <div className={styles.spinner} />}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </AppLayout>
  );
}
