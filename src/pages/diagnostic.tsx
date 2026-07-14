import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import RequireAuth from "@/components/RequireAuth";
import styles from "./Diagnostic.module.css";

type Question = {
  id: string;
  concept: string;
  prerequisite: string | null;
  prompt: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  difficulty: number;
  reason: string;
};

type Summary = {
  readiness: number;
  strengths: string[];
  priorities: string[];
  nextSteps: Array<{ concept: string; why: string }>;
};

export default function DiagnosticPage() {
  return (
    <RequireAuth>
      <Head><title>Learning diagnostic · StudySmart</title></Head>
      <DiagnosticExperience />
    </RequireAuth>
  );
}

function DiagnosticExperience() {
  const [assessmentId, setAssessmentId] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState("");
  const [progress, setProgress] = useState({ answered: 0, total: 6 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [priorSummary, setPriorSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/diagnostic")
      .then((response) => response.json())
      .then((data) => {
        if (data.assessment?.status === "COMPLETED") {
          setPriorSummary(data.assessment.summary);
        }
      })
      .catch(() => undefined);
  }, []);

  async function start() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await response.json();
      if (!response.ok) {throw new Error(data.error ?? "Could not begin.");}
      setAssessmentId(data.assessmentId);
      setQuestion(data.question);
      setProgress(data.progress);
      setSummary(null);
      setPriorSummary(null);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not begin.");
    } finally {
      setLoading(false);
    }
  }

  async function answer() {
    if (!question || !selected) {return;}
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          assessmentId,
          questionId: question.id,
          answer: selected,
        }),
      });
      const data = await response.json();
      if (!response.ok) {throw new Error(data.error ?? "Could not save that answer.");}
      setSelected("");
      if (data.complete) {
        setSummary(data.summary);
        setQuestion(null);
      } else {
        setQuestion(data.question);
        setProgress(data.progress);
      }
    } catch (answerError) {
      setError(
        answerError instanceof Error ? answerError.message : "Could not continue."
      );
    } finally {
      setLoading(false);
    }
  }

  const shownSummary = summary ?? priorSummary;
  return (
    <div className={styles.page}>
      <section className={styles.shell} aria-labelledby="diagnostic-title">
        <p className={styles.eyebrow}>Adaptive readiness check</p>
        <h1 id="diagnostic-title">Find the right starting point</h1>
        <p className={styles.intro}>
          Each answer adjusts what comes next. StudySmart checks prerequisites,
          updates your knowledge map, and explains why each recommended skill matters.
        </p>

        {!question && !shownSummary && (
          <div className={styles.startCard}>
            <div><strong>About 4 minutes</strong><span>Six questions · no grades or judgment</span></div>
            <button type="button" onClick={start} disabled={loading}>
              {loading ? "Building your check…" : "Start diagnostic"}
            </button>
          </div>
        )}

        {question && (
          <div className={styles.questionCard}>
            <div className={styles.progressLine}>
              <span>Question {progress.answered + 1} of {progress.total}</span>
              <span>Adapting difficulty</span>
            </div>
            <div className={styles.track}><span style={{ width: `${(progress.answered / progress.total) * 100}%` }} /></div>
            <p className={styles.concept}>{question.concept}</p>
            <h2>{question.prompt}</h2>
            <div className={styles.options}>
              {(Object.entries(question.options) as Array<[string, string]>).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  className={selected === key ? styles.selected : ""}
                  aria-pressed={selected === key}
                  onClick={() => setSelected(key)}
                >
                  <strong>{key}</strong><span>{value}</span>
                </button>
              ))}
            </div>
            <button className={styles.continue} type="button" onClick={answer} disabled={!selected || loading}>
              {loading ? "Adjusting…" : "Continue"}
            </button>
          </div>
        )}

        {shownSummary && (
          <div className={styles.summary}>
            <div className={styles.readiness}>
              <strong>{shownSummary.readiness}%</strong>
              <span>current readiness estimate</span>
            </div>
            <div>
              <p className={styles.eyebrow}>Your explainable learning path</p>
              <h2>What StudySmart recommends next</h2>
            </div>
            <div className={styles.nextGrid}>
              {shownSummary.nextSteps.length > 0 ? shownSummary.nextSteps.map((step, index) => (
                <article key={step.concept}>
                  <span>{index + 1}</span><div><h3>{step.concept}</h3><p>{step.why}</p></div>
                </article>
              )) : <p>Strong readiness across the skills checked. We’ll raise the challenge as you learn.</p>}
            </div>
            <div className={styles.actions}>
              <Link href="/dashboard">Open my learning path</Link>
              <button type="button" onClick={start} disabled={loading}>Retake diagnostic</button>
            </div>
          </div>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    </div>
  );
}
