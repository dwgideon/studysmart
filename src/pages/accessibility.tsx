import Head from "next/head";
import styles from "./Policy.module.css";

export default function AccessibilityPage() {
  return <div className={styles.page}>
    <Head><title>Accessibility · StudySmart</title></Head>
    <header className={styles.hero}><p className={styles.eyebrow}>Every learner belongs</p><h1>Accessibility</h1><p>StudySmart aims for WCAG 2.2 AA and age-appropriate, multimodal learning.</p><p className={styles.meta}>Last technical review: July 16, 2026</p></header>
    <section className={styles.section}><h2>Available controls</h2><ul><li>Keyboard navigation, visible focus, skip links, labeled regions, and semantic controls.</li><li>Large and extra-large text, high contrast, reading-friendly typography, and reduced motion.</li><li>Visible words paired with optional read-aloud support and adjustable safe speech rates for younger learners.</li><li>Responsive layouts for phone, tablet, desktop, zoom, and reflow.</li></ul></section>
    <section className={styles.section}><h2>Known assurance gate</h2><p>An independent WCAG 2.2 AA audit with screen readers, keyboard-only use, zoom/reflow, contrast, cognitive accessibility, mobile devices, and real learners has not yet been completed. Findings from that audit must be remediated before accessibility conformance is claimed.</p></section>
    <section className={styles.section}><h2>Request an accommodation or report a barrier</h2><p>Signed-in users can report a privacy or accessibility concern through the Trust Center. The production operator must publish a monitored accessibility contact before public launch.</p></section>
  </div>;
}
