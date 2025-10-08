// src/pages/index.tsx
import { useState } from "react";
import { useRouter } from "next/router";

export default function IndexPage() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("notes"); // "quiz" or "notes"
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Study Smarter, Not Harder
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic"
            className="w-full border px-3 py-2 rounded-md"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
          >
            <option value="notes">Notes</option>
            <option value="quiz">Quiz</option>
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full border px-3 py-2 rounded-md"
          />

          {error && <p className="text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md"
          >
            {loading ? "Processing..." : "Generate Study Material"}
          </button>
        </form>
      </div>
    </main>
  );
}
