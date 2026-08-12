import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import styles from "./Curriculum.module.css";

type LessonSummary = { id: string; sequence: number; title: string; objective: string; status: string; quality: { passed: boolean } };
type UnitSummary = { id: string; title: string; description: string; grade: string; subject: string; lessonCount: number; standards: Array<{ code: string; statement: string }>; source: { attribution: string; license: string }; lessons: LessonSummary[] };

export default function CurriculumPage() {
  return <RequireAuth><CurriculumContent /></RequireAuth>;
}

function CurriculumContent() {
  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/curriculum").then((response) => response.json()).then((data) => setUnits(data.units ?? [])).finally(() => setLoading(false)); }, []);
  const visible = filter === "ALL" ? units : units.filter((unit) => unit.grade === filter);
  return <>
    <Head><title>Curriculum Studio · StudySmart</title><meta name="description" content="StudySmart's authored K–8 pilot curriculum with lesson-by-lesson practice, read-aloud support, and mastery evidence." /></Head>
    <main className={styles.page}>
      <section className={styles.hero}><div><p className={styles.eyebrow}>STUDYSMART ORIGINALS · PILOT LIBRARY</p><h1>Lessons that teach, check, repair, and remember.</h1><p className={styles.lede}>Every lesson follows the same evidence-rich arc, adapts for the learner’s grade band, and feeds the same mastery model used by quizzes, cards, games, and the tutor.</p></div><div className={styles.signal}><span>30</span><small>published pilot lessons</small><small>3 quality-gated units</small></div></section>
      <section className={styles.toolbar} aria-label="Filter curriculum"><label>Grade <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All pilots</option><option value="K">Kindergarten</option><option value="4">Grade 4</option><option value="6">Grade 6</option></select></label><span>{loading ? "Loading lessons…" : `${visible.length} pilot units`}</span></section>
      <section className={styles.grid}>{visible.map((unit) => <article className={styles.unit} key={unit.id}><div className={styles.unitTop}><span>{unit.subject}</span><b>{unit.grade === "K" ? "Kindergarten" : `Grade ${unit.grade}`}</b></div><h2>{unit.title}</h2><p>{unit.description}</p><div className={styles.meta}><span>{unit.lessonCount} lessons</span><span>{unit.standards.map((standard) => standard.code).join(" · ")}</span></div><ol className={styles.lessonList}>{unit.lessons.map((lesson) => <li key={lesson.id}><Link href={`/curriculum/${lesson.id}`}><span>{String(lesson.sequence).padStart(2, "0")}</span><div><strong>{lesson.title}</strong><small>{lesson.objective}</small></div><em aria-label={lesson.quality.passed ? "Quality gate passed" : "Needs review"}>{lesson.quality.passed ? "READY" : "REVIEW"}</em></Link></li>)}</ol><small className={styles.source}>{unit.source.attribution} · {unit.source.license}</small></article>)}</section>
    </main>
  </>;
}
