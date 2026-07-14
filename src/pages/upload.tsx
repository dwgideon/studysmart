// src/pages/upload.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import RequireAuth from "@/components/RequireAuth";
import styles from "./Upload.module.css";
import Link from "next/link";

export default function UploadPage() {
  return (
    <RequireAuth>
      <UploadForm />
    </RequireAuth>
  );
}

function UploadForm() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (!text && !file) {
      setError("Please paste notes or upload a file.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();

      if (text) {formData.append("text", text);}
      if (file) {formData.append("file", file);}

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 60000); // 60 seconds

      const res = await fetch("/api/processMaterials", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        if (res.status === 423 && payload.code === "LEARNING_LOCKED") {
          await router.push("/safety-lock");
          return;
        }
        const accessMessage = payload.error === "AGE_GROUP_REQUIRED"
          ? "Choose your age group in the Trust Center first."
          : ["PARENTAL_CONSENT_REQUIRED", "DISTRICT_GUARDIAN_CONSENT_REQUIRED"].includes(payload.error)
            ? "A connected guardian must approve AI learning first."
            : payload.error === "DISTRICT_AI_DISABLED"
              ? "Your school or district has disabled AI processing."
            : payload.error;
        throw new Error(accessMessage || "Could not process that material.");
      }

      const result = await res.json();
      if (result.sessionId) {
        router.push(`/results?sessionId=${result.sessionId}`);
      } else {
        throw new Error("No sessionId returned from API.");
      }
    } catch (err: unknown) {
      console.error("UPLOAD ERROR:", err);

      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Upload timed out. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Upload Your Study Material</h1>
        <p>Paste notes or add a PDF, document, slide deck, image, handwriting sample, audio lesson, or short study video. StudySmart preserves source locations for citations.</p>

        <label>
          <span>Study notes or lesson text</span>
          <textarea
            className={styles.textarea}
            placeholder="Paste notes here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <div className={styles.fileRow}>
          <label className={styles.fileLabel}>
            Upload File
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav,.ogg,.mp4,.webm,text/plain,text/markdown,text/csv,application/json,application/pdf,image/*,audio/*,video/mp4,video/webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              hidden
            />
          </label>

          {file && <span className={styles.fileName}>{file.name}</span>}
        </div>

        {error && <div role="alert"><p>{error}</p>{error.includes("Trust Center") && <Link href="/trust">Open Trust Center</Link>}</div>}

        <button
          type="button"
          className={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Reading, grounding, and generating…" : "Build grounded study set"}
        </button>
      </div>
    </div>
  );
}
