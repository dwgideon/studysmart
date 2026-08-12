import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import TalkingCompanion from "@/components/TalkingCompanion";
import { companionById } from "@/lib/learningCompanions";
import type { CurriculumLesson, PracticeItem } from "@/lib/curriculumSchema";
import styles from "../LessonPlayer.module.css";

type Phase = "WARMUP" | "EXPLAIN" | "EXAMPLE" | "GUIDED" | "INDEPENDENT" | "REPAIR" | "QUIZ" | "EXIT" | "COMPLETE";
type Result = { score: number; mastered: boolean; xp: number; nextStep: { when: string; steps: string[]; nextLessonId?: string } };

export default function LessonPage() {
  return <RequireAuth><LessonContent /></RequireAuth>;
}

function LessonContent() {
  const router = useRouter();
  const lessonId = typeof router.query.lessonId === "string" ? router.query.lessonId : "";
  const [lesson, setLesson] = useState<CurriculumLesson | null>(null);
  const [phase, setPhase] = useState<Phase>("WARMUP");
  const [guidedIndex, setGuidedIndex] = useState(0);
  const [independentIndex, setIndependentIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [input, setInput] = useState("");
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [practiceCorrect, setPracticeCorrect] = useState<Record<string, boolean>>({});
  const [exitAnswer, setExitAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useMemo(() => Date.now(), []);

  useEffect(() => {
    if (!lessonId) {return;}
    fetch(`/api/curriculum/lesson/${encodeURIComponent(lessonId)}`).then(async (response) => { const data = await response.json(); if (!response.ok) {throw new Error(data.error ?? "Lesson unavailable");} return data; }).then((data) => { setLesson(data.lesson); void sendEvent(lessonId, "LESSON_VIEWED"); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Lesson unavailable")).finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {return <main className={styles.loading}>Preparing your lesson…</main>;}
  if (error || !lesson) {return <main className={styles.loading} role="alert">{error || "Lesson unavailable."}<Link href="/curriculum">Back to curriculum</Link></main>;}
  const activeLesson = lesson;

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {return;}
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = activeLesson.grade === "K" ? 0.82 : 0.95;
    window.speechSynthesis.speak(utterance);
    void sendEvent(activeLesson.id, "READ_ALOUD_USED");
  }

  function recordAnswer(id: string, answer: string | number) {setResponses((current) => ({ ...current, [id]: answer }));}

  function submitPractice(item: PracticeItem, next: () => void) {
    const correct = normalize(input) === normalize(item.answer) || (normalize(item.answer).length > 4 && normalize(input).includes(normalize(item.answer)));
    recordAnswer(item.id, input);
    setPracticeCorrect((current) => ({ ...current, [item.id]: correct }));
    setInput("");
    next();
  }

  async function complete() {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/curriculum/lesson/${encodeURIComponent(activeLesson.id)}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responses: Object.entries(responses).map(([id, answer]) => ({ id, answer, correct: practiceCorrect[id] })), exitTicketAnswer: exitAnswer, durationMs: Date.now() - startedAt }) });
      const data = await response.json();
      if (!response.ok) {throw new Error(data.error ?? "Could not save lesson");}
      setResult(data); setPhase("COMPLETE");
    } catch (cause) {setError(cause instanceof Error ? cause.message : "Could not save lesson");}
    finally {setSaving(false);}
  }

  const currentQuiz = lesson.quizQuestions[quizIndex];
  const currentGuided = lesson.guidedPractice[guidedIndex];
  const currentIndependent = lesson.independentPractice[independentIndex];
  const progress = { WARMUP: 8, EXPLAIN: 20, EXAMPLE: 32, GUIDED: 46, INDEPENDENT: 60, REPAIR: 70, QUIZ: 82, EXIT: 94, COMPLETE: 100 }[phase];
  return <>
    <Head><title>{lesson.title} · StudySmart</title></Head>
    <main className={styles.page}>
      <div className={styles.topbar}><Link href="/curriculum" className={styles.back}>← Curriculum</Link><div><span className={styles.unitLabel}>{lesson.subject} · {lesson.grade === "K" ? "Kindergarten" : `Grade ${lesson.grade}`}</span><strong>{lesson.sequence.toString().padStart(2, "0")} / 10</strong></div><button type="button" className={styles.speakButton} onClick={() => speak(lesson.readAloudScript.join(" "))}>🔊 Read lesson</button></div>
      <div className={styles.progress}><span style={{ width: `${progress}%` }} /></div>
      <section className={styles.lessonShell}>
        <header className={styles.lessonHeader}><p className={styles.eyebrow}>LESSON {lesson.sequence} · {lesson.status}</p><h1>{lesson.title}</h1><p className={styles.objective}><b>Today’s objective</b> {lesson.learningObjective}</p></header>
        {phase === "WARMUP" && <Step title="Warm up your memory" kicker="RETRIEVAL" onNext={() => setPhase("EXPLAIN")}><p>Before we teach a new idea, try one you may already know.</p><QuizCard question={lesson.quizQuestions[0]} selected={responses[lesson.quizQuestions[0].id]} onSelect={(answer) => { recordAnswer(lesson.quizQuestions[0].id, answer); setPhase("EXPLAIN"); }} /></Step>}
        {phase === "EXPLAIN" && <Step title="Build the idea" kicker="SHORT EXPLANATION" onNext={() => setPhase("EXAMPLE")} speak={() => speak(lesson.studentExplanation)}>{lesson.grade === "K" && companionById("nova_fox") && <TalkingCompanion companion={companionById("nova_fox")!} text={lesson.studentExplanation} speechRate={0.82} compact />}<div className={styles.explanation}><p>{lesson.studentExplanation}</p><details><summary>Teacher view</summary><p>{lesson.teacherExplanation}</p></details></div></Step>}
        {phase === "EXAMPLE" && <Step title="Watch one worked example" kicker="DEMONSTRATION" onNext={() => setPhase("GUIDED")} speak={() => speak(`${lesson.workedExample.prompt} ${lesson.workedExample.steps.join(" ")} ${lesson.workedExample.answer}`)}><h2>{lesson.workedExample.prompt}</h2><ol className={styles.steps}>{lesson.workedExample.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol><div className={styles.answerReveal}><b>Answer</b><span>{lesson.workedExample.answer}</span><small>{lesson.workedExample.whyItWorks}</small></div></Step>}
        {phase === "GUIDED" && <Step title="Try it with a guide" kicker={`GUIDED PRACTICE · ${guidedIndex + 1} / ${lesson.guidedPractice.length}`} onNext={() => { if (guidedIndex + 1 < lesson.guidedPractice.length) {setGuidedIndex((index) => index + 1);} else {setPhase("INDEPENDENT");} }}><PracticeCard item={currentGuided} input={input} setInput={setInput} onHint={() => { void sendEvent(lesson.id, "GUIDED_HINT_USED"); }} onSubmit={() => submitPractice(currentGuided, () => { if (guidedIndex + 1 < lesson.guidedPractice.length) {setGuidedIndex((index) => index + 1);} else {setPhase("INDEPENDENT");} })} submitted={practiceCorrect[currentGuided.id] !== undefined} correct={practiceCorrect[currentGuided.id]} /></Step>}
        {phase === "INDEPENDENT" && <Step title="Show what you know" kicker={`INDEPENDENT PRACTICE · ${independentIndex + 1} / ${lesson.independentPractice.length}`} onNext={() => { if (independentIndex + 1 < lesson.independentPractice.length) {setIndependentIndex((index) => index + 1);} else {setPhase("REPAIR");} }}><PracticeCard item={currentIndependent} input={input} setInput={setInput} onHint={() => { void sendEvent(lesson.id, "GUIDED_HINT_USED"); }} onSubmit={() => submitPractice(currentIndependent, () => { if (independentIndex + 1 < lesson.independentPractice.length) {setIndependentIndex((index) => index + 1);} else {setPhase("REPAIR");} })} submitted={practiceCorrect[currentIndependent.id] !== undefined} correct={practiceCorrect[currentIndependent.id]} /></Step>}
        {phase === "REPAIR" && <Step title="Catch the tricky part" kicker="MISCONCEPTION CHECK" onNext={() => setPhase("QUIZ")} speak={() => speak(`${lesson.misconceptionChecks[0].prompt} ${lesson.misconceptionChecks[0].repair}`)}><div className={styles.repair}><p><b>Common trap:</b> {lesson.misconceptionChecks[0].misconception}</p><h2>{lesson.misconceptionChecks[0].prompt}</h2><p className={styles.repairAnswer}>{lesson.misconceptionChecks[0].expectedResponse}</p><p>{lesson.misconceptionChecks[0].repair}</p></div></Step>}
        {phase === "QUIZ" && <Step title="Prove it independently" kicker={`MIXED CHECK · ${quizIndex + 1} / ${lesson.quizQuestions.length}`} onNext={() => { if (quizIndex + 1 < lesson.quizQuestions.length) {setQuizIndex((index) => index + 1);} else {setPhase("EXIT");} }}><QuizCard question={currentQuiz} selected={responses[currentQuiz.id]} onSelect={(answer) => recordAnswer(currentQuiz.id, answer)} /></Step>}
        {phase === "EXIT" && <Step title="Exit ticket" kicker="MASTERY EVIDENCE" onNext={() => void complete()} disabled={saving}><p>{lesson.exitTicket.prompt}</p><textarea className={styles.responseBox} value={exitAnswer} onChange={(event) => setExitAnswer(event.target.value)} placeholder="Explain your thinking…" aria-label="Exit ticket answer" /><p className={styles.criteria}><b>Success looks like:</b> {lesson.exitTicket.successCriteria}</p>{error && <p className={styles.error} role="alert">{error}</p>}</Step>}
        {phase === "COMPLETE" && result && <section className={styles.complete}><p className={styles.eyebrow}>EVIDENCE SAVED · MASTERY UPDATED</p><div className={styles.score}>{result.score}<small>%</small></div><h2>{result.mastered ? "You’re ready for the next idea." : "Good work. One more pass will make it stick."}</h2><p>You earned {result.xp} XP. The tutor, games, flashcards, and review schedule now share this evidence.</p><div className={styles.nextStep}><b>{result.mastered ? "Extension path" : "Remediation path"}</b>{result.nextStep.steps.map((step) => <span key={step}>→ {step}</span>)}</div><div className={styles.completeActions}>{result.nextStep.nextLessonId && <Link href={`/curriculum/${result.nextStep.nextLessonId}`} className={styles.primaryButton}>Next lesson →</Link>}<Link href="/studio" className={styles.secondaryButton}>Back to Study Studio</Link></div></section>}
      </section>
    </main>
  </>;
}

function Step({ title, kicker, children, onNext, speak, disabled }: { title: string; kicker: string; children: React.ReactNode; onNext: () => void; speak?: () => void; disabled?: boolean }) {return <section className={styles.step}><p className={styles.kicker}>{kicker}</p><h2>{title}</h2><div className={styles.stepBody}>{children}</div><div className={styles.stepActions}>{speak && <button type="button" className={styles.secondaryButton} onClick={speak}>🔊 Hear this</button>}<button type="button" className={styles.primaryButton} onClick={onNext} disabled={disabled}>{disabled ? "Saving…" : "Continue →"}</button></div></section>;}

function QuizCard({ question, selected, onSelect }: { question: CurriculumLesson["quizQuestions"][number]; selected?: string | number; onSelect: (answer: number) => void }) {return <div className={styles.quizCard}><h3>{question.prompt}</h3><div className={styles.options}>{question.options.map((option, index) => <button type="button" key={option} className={selected === index ? styles.optionSelected : ""} onClick={() => onSelect(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{selected !== undefined && <p className={styles.feedback}>{Number(selected) === question.answerIndex ? "Correct — explain why it works." : `Not quite. ${question.explanation}`}</p>}</div>;}

function PracticeCard({ item, input, setInput, onHint, onSubmit, submitted, correct }: { item: PracticeItem; input: string; setInput: (value: string) => void; onHint: () => void; onSubmit: () => void; submitted: boolean; correct?: boolean }) {return <div className={styles.practiceCard}><h3>{item.prompt}</h3><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type or say your answer" aria-label="Practice answer" disabled={submitted} /><div className={styles.practiceActions}><button type="button" className={styles.secondaryButton} onClick={onHint}>Need a hint</button><button type="button" className={styles.primaryButton} onClick={onSubmit} disabled={!input.trim() || submitted}>{submitted ? (correct ? "Correct ✓" : "Review →") : "Check answer"}</button></div>{submitted && <p className={correct ? styles.correct : styles.feedback}>{correct ? item.feedback : `${item.feedback} Try the idea again in your own words.`}</p>}</div>;}

async function sendEvent(lessonId: string, eventType: string) {try {await fetch("/api/curriculum/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, eventType }) });} catch { /* analytics must never block learning */ }}
function normalize(value: string) {return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();}
