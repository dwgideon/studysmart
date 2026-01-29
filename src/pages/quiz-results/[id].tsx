import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import layout from "../../styles/layout.module.css";

type TopicData = {
  title: string;
  description: string;
  lessons: string[];
};

export default function TopicPage() {
  const router = useRouter();
  const { id } = router.query;

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadTopic = async () => {
      try {
        // 🔧 placeholder — later this will come from DB
        setTopic({
          title: String(id).replace(/-/g, " "),
          description:
            "This topic will help you master key concepts through guided practice, quizzes, and flashcards.",
          lessons: [
            "Introduction and Key Terms",
            "Worked Examples",
            "Practice Problems",
            "Quiz Review",
          ],
        });
      } catch (err) {
        console.error("Failed to load topic", err);
      } finally {
        setLoading(false);
      }
    };

    loadTopic();
  }, [id]);

  return (
    <AppLayout>
      <section className={layout.card}>
        {loading ? (
          <p>Loading topic…</p>
        ) : !topic ? (
          <p>Topic not found.</p>
        ) : (
          <>
            <h1 style={{ marginBottom: "0.5rem" }}>{topic.title}</h1>
            <p style={{ opacity: 0.8, marginBottom: "1.25rem" }}>
              {topic.description}
            </p>

            <h3>What you’ll cover:</h3>
            <ul style={{ marginTop: "0.5rem" }}>
              {topic.lessons.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </>
        )}
      </section>
    </AppLayout>
  );
}
