import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Landing.module.css";

const capabilities = [
  { code: "01", title: "Sees the whole learner", text: "A living knowledge map connects every tutor conversation, quiz answer, flashcard, and review." },
  { code: "02", title: "Knows what comes next", text: "The Learning Brain chooses the highest-impact next action—and clearly explains why." },
  { code: "03", title: "Grounded, not guessing", text: "Every response distinguishes uploaded class material from general knowledge with source-level citations." },
  { code: "04", title: "Built around childhood", text: "Age-aware experiences, accessibility controls, guardian visibility, and safety architecture come standard." },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>StudySmart · The K–12 Learning Operating System</title>
        <meta name="description" content="A connected, adaptive, and safe learning operating system built for every K–12 learner." />
      </Head>

      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.systemBadge}><span /> K–12 LEARNING INTELLIGENCE · ONLINE</div>
            <h1>A learning system that <em>thinks ahead.</em></h1>
            <p className={styles.subtitle}>StudySmart turns class material into a connected learning path—adapting explanations, practice, and review to the way each student learns.</p>
            <div className={styles.heroActions}>
              <Link href="/upload" className={styles.primaryBtn}>Build my learning path <span>→</span></Link>
              <Link href="/dashboard" className={styles.secondaryBtn}><i /> Explore the workspace</Link>
            </div>
            <div className={styles.trustLine}><span>Source-grounded</span><span>Age-aware</span><span>Accessible</span><span>Guardian-connected</span></div>
          </div>

          <div className={styles.engine} aria-label="A visualization of StudySmart's connected learning engine">
            <div className={styles.engineGlow} />
            <div className={`${styles.orbit} ${styles.orbitOuter}`}><span className={styles.nodeTutor}>TUTOR</span><span className={styles.nodeRecall}>RECALL</span></div>
            <div className={`${styles.orbit} ${styles.orbitInner}`}><span className={styles.nodeMastery}>MASTERY</span><span className={styles.nodeSources}>SOURCES</span></div>
            <div className={styles.brain}>
              <span>LEARNING</span><strong>BRAIN</strong><small>ADAPTIVE MODEL</small>
            </div>
            <div className={`${styles.metric} ${styles.metricTop}`}><small>NEXT REVIEW</small><strong>2:40 PM</strong><span>Optimal window</span></div>
            <div className={`${styles.metric} ${styles.metricBottom}`}><small>CONCEPT SIGNAL</small><strong>+18%</strong><span>Growing</span></div>
          </div>
        </div>
        <div className={styles.scrollCue}><span /> DISCOVER THE SYSTEM</div>
      </section>

      <section className={styles.proofStrip} aria-label="Platform qualities">
        <div><b>01</b><strong>CONNECTED</strong><span>One learning memory</span></div>
        <div><b>02</b><strong>ADAPTIVE</strong><span>Every next step</span></div>
        <div><b>03</b><strong>GROUNDED</strong><span>Sources in view</span></div>
        <div><b>04</b><strong>SAFE</strong><span>Designed for K–12</span></div>
      </section>

      <section className={styles.intelligence}>
        <header className={styles.sectionHeader}>
          <div><span className={styles.kicker}>THE INTELLIGENCE LAYER</span><h2>More than tools.<br />One learning mind.</h2></div>
          <p>Most learning products make students choose disconnected activities. StudySmart connects the evidence, understands the goal, and orchestrates the path.</p>
        </header>
        <div className={styles.bento}>
          <article className={`${styles.capability} ${styles.capabilityLarge}`}>
            <div className={styles.cardTop}><span>LIVE KNOWLEDGE MAP</span><b>● SYNCED</b></div>
            <div className={styles.mapVisual} aria-hidden="true"><span className={styles.mapCenter}>Photosynthesis<small>72% · DEVELOPING</small></span><i /><i /><i /><i /></div>
            <h3>{capabilities[0].title}</h3><p>{capabilities[0].text}</p>
          </article>
          {capabilities.slice(1).map((item) => (
            <article className={styles.capability} key={item.code}>
              <div className={styles.cardTop}><span>{item.code === "02" ? "ADAPTIVE ORCHESTRATION" : item.code === "03" ? "EVIDENCE ENGINE" : "TRUST ARCHITECTURE"}</span><b>{item.code}</b></div>
              <div className={styles.signal} aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <h3>{item.title}</h3><p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.flow}>
        <span className={styles.kicker}>A CONTINUOUS LEARNING LOOP</span>
        <h2>Everything teaches the system.<br />The system teaches the student.</h2>
        <div className={styles.flowGrid}>
          {[["01","ADD","Class notes, worksheets, books, images, audio, or video"],["02","UNDERSTAND","Concepts, prerequisites, misconceptions, and source evidence"],["03","LEARN","Tutor, quizzes, study guides, games, and flashcards adapt together"],["04","REMEMBER","Spaced review arrives at the moment memory needs it"]].map(([n,t,d]) => <div key={n}><b>{n}</b><span>{t}</span><p>{d}</p></div>)}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaOrb} aria-hidden="true" />
        <span className={styles.kicker}>YOUR LEARNING SYSTEM IS READY</span>
        <h2>Don’t just study harder.<br /><em>Learn intelligently.</em></h2>
        <p>Start with the material already on your desk.</p>
        <Link href="/upload" className={styles.primaryBtn}>Launch StudySmart <span>→</span></Link>
      </section>
    </>
  );
}
