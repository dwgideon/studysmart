import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import { useStudyStreak } from "../hooks/useStudyStreak";
import { useXP } from "../hooks/useXP";
import layout from "../styles/layout.module.css";
import styles from "../styles/Dashboard.module.css";
import { useK12Experience } from "@/components/K12Experience";

type Session = {
  id: string;
  topic: string;
  score: number;
  total: number;
  accuracy: number;
  completed: boolean;
  created_at: string;
};

type ConceptMastery = {
  id: string;
  name: string;
  course: { id: string; name: string; subject: string };
  score: number;
  confidence: number;
  status: "NEW" | "LEARNING" | "DEVELOPING" | "MASTERED";
  attempts: number;
  due?: boolean;
  predictedRetention?: number;
  priority?: number;
  recommendedMode?: string;
};

type MasterySummary = {
  totalConcepts: number;
  averageScore: number;
  mastered: number;
  needsWork: number;
};

type ReviewQueue = {
  dueNow: number;
  dueTomorrow: number;
  dailyLimit: number;
  nextReviewAt: string | null;
};

type LearningRecommendation = {
  mode: string;
  title: string;
  reason: string;
  actionPath: string;
  actionLabel: string;
  confidence?: number;
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsDiagnostic, setNeedsDiagnostic] = useState(false);
  const [concepts, setConcepts] = useState<ConceptMastery[]>([]);
  const [masterySummary, setMasterySummary] = useState<MasterySummary | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueue | null>(null);
  const [recommendation, setRecommendation] = useState<LearningRecommendation | null>(null);
  const { streak } = useStudyStreak();
  const { xp, level } = useXP();
  const { labels, gradeBand } = useK12Experience();

  useEffect(() => {
    fetch("/api/getSessions")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setSessions(data) : []))
      .catch(console.error);

    fetch("/api/profile/learning-context")
      .then((response) => response.json())
      .then((data) => {
        setNeedsOnboarding(!data.profile?.onboardingCompleted);
        setNeedsDiagnostic(
          Boolean(data.profile?.onboardingCompleted) &&
          !data.profile?.diagnosticCompleted
        );
      })
      .catch(console.error);

    fetch("/api/mastery")
      .then((response) => response.json())
      .then((data) => {
        setConcepts(Array.isArray(data.concepts) ? data.concepts : []);
        setMasterySummary(data.summary ?? null);
      })
      .catch(console.error);

    fetch("/api/review-queue")
      .then((response) => response.json())
      .then(setReviewQueue)
      .catch(console.error);

    fetch("/api/learning/next")
      .then((response) => response.json())
      .then((data) => setRecommendation(data.recommendation ?? null))
      .catch(console.error);
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{labels.dashboard}</h1>
      <p className={styles.subtitle}>
        {gradeBand === "EARLY" || gradeBand === "ELEMENTARY"
          ? "See what you know, what to practice, and every win along the way."
          : "See your evidence, priorities, and the reason behind every next step."}
      </p>

      {needsOnboarding && (
        <section className={styles.onboardingCard} aria-labelledby="personalize-title">
          <div>
            <p className={styles.onboardingLabel}>Recommended next step</p>
            <h2 id="personalize-title">Personalize your learning</h2>
            <p>Set your grade, course, exam date, and goal so StudySmart can adapt to you.</p>
          </div>
          <Link href="/onboarding" className={styles.primaryBtn}>Get started</Link>
        </section>
      )}

      {needsDiagnostic && (
        <section className={styles.onboardingCard} aria-labelledby="diagnostic-title">
          <div>
            <p className={styles.onboardingLabel}>Recommended next step</p>
            <h2 id="diagnostic-title">Find your best starting point</h2>
            <p>A short adaptive check will identify prerequisite gaps and build your learning path.</p>
          </div>
          <Link href="/diagnostic" className={styles.primaryBtn}>Take diagnostic</Link>
        </section>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className={layout.card}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Current streak
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {streak?.currentStreak ?? 0} days
          </p>
        </div>
        <div className={layout.card}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Best streak
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {streak?.longestStreak ?? 0} days
          </p>
        </div>
        <div className={layout.card}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            XP / Level
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {xp} XP · Lv {level}
          </p>
        </div>
      </div>

      <section className={layout.card} style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <Link href="/upload" className={styles.primaryBtn}>
            Upload
          </Link>
          <Link href="/study" className={styles.primaryBtn}>
            Study
          </Link>
          <Link href="/smart" className={styles.primaryBtn}>
            Smart review
          </Link>
          <Link href="/quiz" className={styles.primaryBtn}>
            Quiz
          </Link>
          <Link href="/tutor" className={styles.primaryBtn}>
            Tutor
          </Link>
          <Link href="/games" className={styles.primaryBtn}>
            Games
          </Link>
          <Link href="/diagnostic" className={styles.primaryBtn}>
            Learning path
          </Link>
          <Link href="/community" className={styles.primaryBtn}>
            Community
          </Link>
        </div>
      </section>

      {recommendation && (
        <section className={styles.nextBestCard} aria-labelledby="next-best-title">
          <div>
            <p className={styles.onboardingLabel}>Learning Brain · highest expected gain</p>
            <h2 id="next-best-title">{recommendation.title}</h2>
            <p>{recommendation.reason}</p>
            {typeof recommendation.confidence === "number" && (
              <small>Model confidence: {recommendation.confidence}% · You can always choose a different activity.</small>
            )}
          </div>
          <Link href={recommendation.actionPath} className={styles.primaryBtn}>
            {recommendation.actionLabel}
          </Link>
        </section>
      )}

      <section className={layout.card} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.masteryHeader}>
          <div>
            <p className={styles.onboardingLabel}>Knowledge map</p>
            <h2 className={styles.sectionTitle}>Concept mastery</h2>
          </div>
          {masterySummary && masterySummary.totalConcepts > 0 && (
            <div className={styles.masteryScore}>
              <strong>{masterySummary.averageScore}%</strong>
              <span>overall</span>
            </div>
          )}
        </div>
        <div className={layout.card}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Due for review
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {reviewQueue?.dueNow ?? 0} cards
          </p>
          <Link href="/smart" className={styles.statLink}>
            Review now
          </Link>
        </div>

        {concepts.length === 0 ? (
          <p className={styles.muted}>
            Upload material after setting your course to begin building your knowledge map.
          </p>
        ) : (
          <div className={styles.conceptGrid}>
            {concepts.slice(0, 8).map((concept) => (
              <article key={concept.id} className={styles.conceptCard}>
                <div className={styles.conceptTopline}>
                  <span>{concept.course.name}</span>
                  <strong>{concept.score}%</strong>
                </div>
                <h3>{concept.name}</h3>
                <div
                  className={styles.masteryTrack}
                  role="progressbar"
                  aria-label={`${concept.name} mastery`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={concept.score}
                >
                  <span style={{ width: `${concept.score}%` }} />
                </div>
                <div className={styles.conceptMeta}>
                  <span>{masteryLabel(concept.status)}</span>
                  <span>
                    {concept.due
                      ? "Due now"
                      : `${concept.predictedRetention ?? 0}% predicted retention`}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={layout.card}>
        <h2 className={styles.sectionTitle}>Recent Study Sessions</h2>

        {sessions.length === 0 ? (
          <p className={styles.muted}>
            No sessions yet.{" "}
            <Link href="/upload">Upload notes</Link> to get started.
          </p>
        ) : (
          <div className={styles.sessionGrid}>
            {sessions.map((s) => (
              <div key={s.id} className={styles.sessionCard}>
                <h4 className={styles.sessionTopic}>{s.topic}</h4>
                <p className={styles.sessionScore}>
                  {s.completed
                    ? `Score: ${s.score}/${s.total} (${s.accuracy}%)`
                    : "In progress"}
                </p>
                <p className={styles.sessionDate}>
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
                <Link href={`/results?sessionId=${s.id}`}>View cards →</Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function masteryLabel(status: ConceptMastery["status"]) {
  const labels = {
    NEW: "Not started",
    LEARNING: "Learning",
    DEVELOPING: "Developing",
    MASTERED: "Mastered",
  } as const;
  return labels[status];
}
