import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [data, setData] = useState<{ flashcards: any[] }>({ flashcards: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    fetch(`/api/getFlashcards?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        setData({ flashcards: json.flashcards ?? [] });
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) return <p>Loading results…</p>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Your Study Materials</h1>

      <button onClick={() => router.push("/flashcards")}>
        View Flashcards
      </button>
    </div>
  );
}
