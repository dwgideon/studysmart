"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Match Prisma Note model (simplified for client-side use)
export interface Note {
  id?: string; // optional, since Prisma generates it
  title: string;
  content: string;
  createdAt?: string;
  userId?: string;
}

export default function IndexPage() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Simulate AI/extraction processing
    setTimeout(() => {
      setNote({
        title: "Biology - Plant Life Cycle",
        content: "Photosynthesis is the process by which plants make food...",
      });
      setLoading(false);
    }, 1500);
  }

  async function handleSave() {
    if (!note) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required to save progress!");
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("/api/saveNote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...note, userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Progress saved! 🎉");
    } catch (err) {
      console.error(err);
      alert("Error saving progress.");
    }
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Upload or Enter a Topic</h1>

      <form onSubmit={handleUpload} style={{ marginBottom: "2rem" }}>
        <input type="file" />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Generate Study Material"}
        </button>
      </form>

      {note && (
        <div style={{ marginTop: "2rem" }}>
          <h2>{note.title}</h2>
          <p>{note.content}</p>
          <button onClick={handleSave}>💾 Save Progress</button>
        </div>
      )}
    </main>
  );
}
