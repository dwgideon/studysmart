import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  K8_GRADES,
  LIBRARY_SUBJECTS,
  listOriginalSets,
  getOriginalLibraryStats,
  type LibraryGrade,
  type LibrarySubject,
  type OriginalSet,
} from "@/lib/studyLibrary";
import styles from "./Library.module.css";

const stats = getOriginalLibraryStats();

export default function LibraryPage() {
  const [grade, setGrade] = useState<LibraryGrade | "ALL">("ALL");
  const [subject, setSubject] = useState<LibrarySubject | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const sets = useMemo(() => listOriginalSets({ grade, subject, search }), [grade, subject, search]);

  return (
    <>
      <Head>
        <title>StudySmart Originals · K–8 learning library</title>
        <meta name="description" content="Browse source-grounded StudySmart Originals for every K–8 grade, subject, and prerequisite skill." />
      </Head>
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>STUDYSMART ORIGINALS · K–8</p>
            <h1>A trusted starting point for every learner.</h1>
            <p className={styles.lede}>Browse educator-reviewed learning blueprints organized by grade, subject, prerequisite skill, and the next idea a learner is ready to understand.</p>
            <div className={styles.heroActions}>
              <Link href="/upload" className={styles.primaryButton}>Bring in class material <span>→</span></Link>
              <Link href="/diagnostic" className={styles.secondaryButton}>Find my starting point</Link>
            </div>
          </div>
          <aside className={styles.signalCard} aria-label="Library coverage">
            <span className={styles.signalDot} />
            <p>ORIGINAL CATALOG</p>
            <strong>{stats.totalSets} sets</strong>
            <span>{stats.grades} grades · {stats.subjects} subject lanes</span>
            <small>Source: StudySmart Originals · educator-reviewed blueprint</small>
          </aside>
        </header>

        <section className={styles.controls} aria-label="Filter the StudySmart Originals library">
          <label>
            <span>Grade</span>
            <select value={grade} onChange={(event) => setGrade(event.target.value as LibraryGrade | "ALL")}>
              <option value="ALL">All K–8 grades</option>
              {K8_GRADES.map((item) => <option key={item} value={item}>{item === "K" ? "Kindergarten" : `Grade ${item}`}</option>)}
            </select>
          </label>
          <label>
            <span>Subject</span>
            <select value={subject} onChange={(event) => setSubject(event.target.value as LibrarySubject | "ALL")}>
              <option value="ALL">All subjects</option>
              {LIBRARY_SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className={styles.searchField}>
            <span>Search topics or skills</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try fractions, ecosystems, evidence…" />
          </label>
          <p className={styles.resultCount} role="status">Showing <strong>{sets.length}</strong> of {stats.totalSets} original sets</p>
        </section>

        {sets.length === 0 ? (
          <section className={styles.empty}>
            <h2>No matching blueprints yet</h2>
            <p>Try a broader subject or search term. You can also bring in your own class material and let the Learning Brain build a grounded path.</p>
            <Link href="/upload" className={styles.secondaryButton}>Add class material</Link>
          </section>
        ) : (
          <section className={styles.grid} aria-label="StudySmart Originals">
            {sets.map((set) => <OriginalCard key={set.id} set={set} expanded={selected === set.id} onToggle={() => setSelected((current) => current === set.id ? null : set.id)} />)}
          </section>
        )}
      </div>
    </>
  );
}

function OriginalCard({ set, expanded, onToggle }: { set: OriginalSet; expanded: boolean; onToggle: () => void }) {
  return (
    <article className={`${styles.card} ${expanded ? styles.cardExpanded : ""}`}>
      <div className={styles.cardTopline}>
        <span>{set.subject}</span>
        <span className={styles.gradePill}>{set.grade === "K" ? "K" : `G${set.grade}`}</span>
      </div>
      <h2>{set.title}</h2>
      <p className={styles.summary}>{set.summary}</p>
      <div className={styles.metaRow}>
        <span>{set.questionCount} questions</span>
        <span>{set.flashcardCount} cards</span>
        <span>{set.estimatedMinutes} min</span>
      </div>
      <div className={styles.tags} aria-label="Skill tags">
        {set.skillTags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      {expanded && (
        <div className={styles.details}>
          <div>
            <h3>Learning goals</h3>
            <ul>{set.learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
          </div>
          <div className={styles.detailGrid}>
            <div><strong>Prerequisites</strong><span>{set.prerequisites.join(" · ")}</span></div>
            <div><strong>Difficulty</strong><span>{set.difficulty.toLocaleLowerCase()}</span></div>
            <div><strong>Standards lane</strong><span>{set.standards.join(" · ")}</span></div>
            <div><strong>Access</strong><span>{set.readAloud ? "Read-aloud ready" : "Visual-first"}</span></div>
          </div>
          <div className={styles.sourceNote}>
            <strong>Source attribution</strong>
            <span>{set.source.label} · {set.source.license}</span>
          </div>
        </div>
      )}
      <button type="button" className={styles.expandButton} onClick={onToggle} aria-expanded={expanded}>
        {expanded ? "Hide blueprint" : "Preview blueprint"}
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
    </article>
  );
}
