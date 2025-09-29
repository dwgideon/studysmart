// StudySmart Admin Dashboard (First Version)

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function AdminDashboard() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTopics = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setTopics(data);
      }
      setLoading(false);
    };

    fetchAllTopics();
  }, []);

  if (loading) return <p>Loading all topics...</p>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Study Review</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <div key={topic.id} className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">{topic.title}</h3>
            {topic.image_url && (
              <img src={topic.image_url} alt={topic.title} className="w-full h-48 object-cover rounded mb-2" />
            )}
            <div className="text-sm text-gray-700 mb-2">
              <strong>Summary:</strong>
              <pre className="whitespace-pre-wrap">{topic.summary?.substring(0, 300) || "N/A"}</pre>
            </div>
            <div className="text-xs text-gray-400">User: {topic.user_id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
