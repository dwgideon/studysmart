import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { useK12Experience } from "@/components/K12Experience";
import styles from "./StudyStudio.module.css";

type Mode = "MATERIAL_FIRST" | "BLENDED" | "CURRICULUM_FIRST";
type Action = {
  id: string;
  kind: string;
  title: string;
  reason: string;
  href: string;
  minutes: number;
  source: string;
};
type Plan = {
  mode: Mode;
  courseName: string;
  subject: string;
  grade: string;
  examDate: string | null;
  daysRemaining: number | null;
  materialCount: number;
  materialTitles: string[];
  matchedOriginals: Array<{ id: string; title: string; topic: string; summary: string; questionCount: number; flashcardCount: number }>;
  coverage: string;
  nextBestAction: Action;
  actions: Action[];
};

function StudioContent() {
  const { config } = useK12Experience();
  const [mode, setMode] = useState<Mode>("BLENDED");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sources, setSources] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlan = useCallback(async (nextMode = mode) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/study-plan?mode=${nextMode}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        if (data.actionPath) {
          setError(`${data.error} `);
        } else {
          throw new Error(data.error ?? "Could not build your study plan.");
        }
        setPlan(null);
        return;
      }
      setPlan(data.plan);
      setSources(data.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build your study plan.");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { void loadPlan(); }, [loadPlan]);

  return (
    <>
      <Head>
        <title>Study Studio · StudySmart</title>
        <meta name="description" content="Build a personalized K–8 study plan from your material and StudySmart curriculum." />
      </Head>
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>STUDY STUDIO · YOUR MATERIAL + OUR CURRICULUM</p>
            <h1>Prepare for the test you actually have.</h1>
            <p className={styles.lede}>
              Upload class material, blend it with age-appropriate instruction, and follow one adaptive path from first explanation to exam-ready recall.
            </p>
          </div>
          <div className={styles.signal}>
            <span className={styles.signalDot} />
            <strong>{config?.displayLabel ?? "K–8 learning path"}</strong>
            <small>{config?.readAloud === "REQUIRED" ? "Words shown and read aloud" : "Built for understanding, not guessing"}</small>
            <Link href="/curriculum" className={styles.secondary}>Explore authored lessons →</Link>
          </div>
        </header>

        <section className={styles.modePanel} aria-labelledby="mode-title">
          <div>
            <p className={styles.eyebrow}>CHOOSE YOUR FOCUS</p>
            <h2 id="mode-title">How should StudySmart prepare you?</h2>
          </div>
          <div className={styles.modeGrid} role="group" aria-label="Study plan mode">
            <ModeButton active={mode === "MATERIAL_FIRST"} onClick={() => { setMode("MATERIAL_FIRST"); void loadPlan("MATERIAL_FIRST"); }} title="My material first" text="Match the exact notes, packet, or slides to the test." />
            <ModeButton active={mode === "BLENDED"} onClick={() => { setMode("BLENDED"); void loadPlan("BLENDED"); }} title="Blend both" text="Use your material plus the missing curriculum foundations." />
            <ModeButton active={mode === "CURRICULUM_FIRST"} onClick={() => { setMode("CURRICULUM_FIRST"); void loadPlan("CURRICULUM_FIRST"); }} title="Curriculum first" text="Build a complete subject foundation, then target the test." />
          </div>
        </section>

        {loading && <div className={styles.loading} role="status">Building your learning path…</div>}
        {error && !loading && (
          <section className={styles.empty} role="alert">
            <h2>Your path needs one more detail</h2>
            <p>{error}</p>
            <div className={styles.actions}><Link href="/onboarding" className={styles.primary}>Set course and exam date</Link><Link href="/upload" className={styles.secondary}>Add study material</Link></div>
          </section>
        )}

        {plan && !loading && (
          <>
            <section className={styles.overview} aria-label="Study plan overview">
              <div><span>Course</span><strong>{plan.courseName}</strong><small>{plan.subject} · Grade {plan.grade}</small></div>
              <div><span>Test runway</span><strong>{plan.daysRemaining === null ? "Self-paced" : `${plan.daysRemaining} days`}</strong><small>{plan.examDate ? `Exam ${new Date(plan.examDate).toLocaleDateString()}` : "Add an exam date for urgency-aware planning"}</small></div>
              <div><span>Coverage</span><strong>{plan.coverage === "BLENDED" ? "Blended path" : plan.coverage === "MATERIAL_ONLY" ? "Material path" : "Curriculum starter"}</strong><small>{plan.materialCount} uploaded source{plan.materialCount === 1 ? "" : "s"} · {plan.matchedOriginals.length} aligned units</small></div>
            </section>

            <section className={styles.nextCard} aria-labelledby="next-title">
              <div><p className={styles.eyebrow}>NEXT BEST MOVE</p><h2 id="next-title">{plan.nextBestAction.title}</h2><p>{plan.nextBestAction.reason}</p><small>{plan.nextBestAction.minutes} minutes · {sourceLabel(plan.nextBestAction.source)}</small></div>
              <Link href={plan.nextBestAction.href} className={styles.primary}>Start now <span aria-hidden="true">→</span></Link>
            </section>

            <div className={styles.columns}>
              <section className={styles.panel} aria-labelledby="path-title">
                <div className={styles.panelHeading}><div><p className={styles.eyebrow}>ADAPTIVE PATH</p><h2 id="path-title">Your sequence</h2></div><span className={styles.count}>{plan.actions.length} moves</span></div>
                <ol className={styles.timeline}>
                  {plan.actions.map((action, index) => <li key={action.id}><span className={styles.step}>{index + 1}</span><div><div className={styles.actionTop}><span className={styles.kind}>{action.kind}</span><span>{action.minutes} min</span></div><h3>{action.title}</h3><p>{action.reason}</p><Link href={action.href}>Open {action.kind.toLowerCase()} →</Link></div></li>)}
                </ol>
              </section>
              <aside className={styles.panel} aria-labelledby="sources-title">
                <div className={styles.panelHeading}><div><p className={styles.eyebrow}>SOURCE LAYER</p><h2 id="sources-title">What this plan uses</h2></div></div>
                {sources.length === 0 ? <div className={styles.sourceEmpty}><p>No class material is connected yet.</p><Link href="/upload" className={styles.secondary}>Upload notes or a packet</Link></div> : <ul className={styles.sourceList}>{sources.map((source) => <li key={source.id}><span className={styles.sourceIcon}>↳</span><div><strong>{source.title}</strong><small>Uploaded material · source citations available</small></div></li>)}</ul>}
                <div className={styles.originals}><h3>Aligned StudySmart units</h3>{plan.matchedOriginals.map((set) => <Link key={set.id} href={`/library?grade=${encodeURIComponent(plan.grade)}&subject=${encodeURIComponent(plan.subject)}&search=${encodeURIComponent(set.topic)}`}><strong>{set.topic}</strong><span>{set.questionCount} questions · {set.flashcardCount} cards</span></Link>)}</div>
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ModeButton({ active, title, text, onClick }: { active: boolean; title: string; text: string; onClick: () => void }) {
  return <button type="button" className={`${styles.modeButton} ${active ? styles.active : ""}`} onClick={onClick} aria-pressed={active}><strong>{title}</strong><span>{text}</span></button>;
}

function sourceLabel(source: string) {
  return source === "UPLOADED_MATERIAL" ? "your material" : source === "STUDYSMART_ORIGINALS" ? "StudySmart curriculum" : "mastery data";
}

export default function StudyStudioPage() {
  return <RequireAuth><StudioContent /></RequireAuth>;
}
