import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function TopicCreate({ user }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Generating AI image...");

    try {
      const res = await fetch("/api/generateTopicImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: title }),
      });

      const { imageUrl, error } = await res.json();
      if (!res.ok || error) {
        throw new Error(error || "Failed image generation");
      }

      const { error: dbError } = await supabase.from("topics").insert({
        user_id: user.id,
        title,
        image_url: imageUrl,
      });

      if (dbError) throw new Error(dbError.message);

      setMessage("Topic created successfully!");
      setTitle("");
    } catch (err) {
      console.error(err);
      setMessage("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow my-10">
      <h2 className="text-2xl font-bold mb-4">Create New Topic</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-medium">Topic Title</label>
        <input
          type="text"
          className="w-full p-2 border rounded mb-4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Creating..." : "Create Topic"}
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
