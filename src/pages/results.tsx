import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import styles from "@/styles/Results.module.css";

type Flashcard = {
  front: string;
  back: string;
};

export default function ResultsPage() {
  const router = useRouter();
  const { sessionId } = router.query;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    async function loadResults() {
      try {
        const res = await fetch(`/api/getNotes?sessionId=${sessionId}`);
        const json: { flashcards?: Flashcard[] } = await res.json();
        setFlashcards(json.flashcards ?? []);
      } catch {
        setFlashcards([]);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [sessionId]);

  if (loading) {
    return (
      <AppLayout>
        <p>Loading results…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        <h1>Your Study Materials</h1>

        <button onClick={() => router.push("/flashcards")}>
          Review Flashcards
        </button>

        {flashcards.length === 0 && (
          <p>No flashcards generated yet.</p>
        )}
      </div>
    </AppLayout>
  );
}
