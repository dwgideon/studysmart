import { useEffect, useState } from "react";
import Link from "next/link";

import layout from "../styles/layout.module.css";
import styles from "../styles/Dashboard.module.css";

type Session = {
  id: string;
  topic: string;
  score: number;
  total: number;
  created_at: string;
};

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch("/api/getSessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(console.error);
  }, []);

  return (
    <>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Track your recent study activity.</p>

      <section className={layout.card}>
        <h2 className={styles.sectionTitle}>Recent Study Sessions</h2>

        {sessions.length === 0 ? (
          <p className={styles.muted}>No sessions yet. Start studying!</p>
        ) : (
          <div className={styles.sessionGrid}>
            {sessions.map((s) => (
              <div key={s.id} className={styles.sessionCard}>
                <h4 className={styles.sessionTopic}>{s.topic}</h4>
                <p className={styles.sessionScore}>
                  Score: {s.score}/{s.total}
                </p>
                <p className={styles.sessionDate}>
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className={styles.actions}>
        <Link href="/upload" className={styles.primaryBtn}>
          Start New Study Session
        </Link>
      </div>
    </>
  );
}
