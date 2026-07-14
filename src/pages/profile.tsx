import { useEffect, useState } from "react";
import Head from "next/head";
import { useUser } from "@supabase/auth-helpers-react";
import RequireAuth from "@/components/RequireAuth";
import LearningContextForm from "@/components/LearningContextForm";
import styles from "./Profile.module.css";

type ProfileStats = {
  sessions: number;
  flashcards: number;
  quizzes: number;
  xp: number;
  level: number;
  mastery: number;
  streak: { currentStreak: number; longestStreak: number };
  activity: Array<{ title: string; subtitle: string; time: string }>;
};

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const user = useUser();
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    fetch("/api/profile/stats")
      .then((response) => response.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <>
      <Head><title>Your profile · StudySmart</title></Head>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Learner profile</p>
              <h1>Welcome back, {displayName}</h1>
              <p>Manage your learning context and see your progress in one place.</p>
            </div>
            <div className={styles.streak} aria-label={`${stats?.streak.currentStreak ?? 0} day study streak`}>
              <span aria-hidden="true">🔥</span>
              <strong>{stats?.streak.currentStreak ?? 0}</strong>
              <small>day streak</small>
            </div>
          </header>

          <section className={styles.stats} aria-label="Learning statistics">
            <Stat label="Study sessions" value={stats?.sessions ?? 0} />
            <Stat label="Flashcards" value={stats?.flashcards ?? 0} />
            <Stat label="Quizzes saved" value={stats?.quizzes ?? 0} />
            <Stat label="Level and XP" value={`Lv ${stats?.level ?? 1} · ${stats?.xp ?? 0} XP`} />
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.panel} aria-labelledby="learning-context-title">
              <h2 id="learning-context-title">Learning context</h2>
              <p className={styles.panelIntro}>
                StudySmart uses this information to personalize explanations,
                practice, and future study schedules.
              </p>
              <LearningContextForm />
            </section>

            <aside className={styles.panel} aria-labelledby="activity-title">
              <h2 id="activity-title">Recent activity</h2>
              {(stats?.activity ?? []).length === 0 ? (
                <p className={styles.empty}>Your completed study sessions will appear here.</p>
              ) : (
                <ol className={styles.activityList}>
                  {stats?.activity.map((item, index) => (
                    <li key={`${item.time}-${index}`}>
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                      <time dateTime={item.time}>{new Date(item.time).toLocaleString()}</time>
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
