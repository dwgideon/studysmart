import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function TopicList({ user }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setTopics(data);
      }
      setLoading(false);
    };

    if (user) {
      fetchTopics();
    }
  }, [user]);

  if (loading) return <p>Loading topics...</p>;

  if (!topics.length) return <p className="text-center mt-10">No topics created yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {topics.map((topic) => (
        <div key={topic.id} className="bg-white rounded shadow overflow-hidden">
          <img
            src={topic.image_url || "/images/default.jpg"}
            alt={topic.title}
            className="object-cover w-full h-48"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold">{topic.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
