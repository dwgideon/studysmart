import Head from "next/head";
import Link from "next/link";
import styles from "./Policy.module.css";

export default function SecurityPage() {
  return <div className={styles.page}>
    <Head><title>Security · StudySmart</title></Head>
    <header className={styles.hero}><p className={styles.eyebrow}>Protecting K–12 data</p><h1>Security</h1><p>Security and child safety are release gates, not marketing certifications.</p></header>
    <section className={styles.section}><h2>Report a vulnerability privately</h2><p>Do not open a public issue or include child data, credentials, tokens, or raw requests. Use <a href="https://github.com/dwgideon/studysmart/security/advisories/new" rel="noreferrer">GitHub’s private security advisory form</a> with the smallest safe reproduction.</p></section>
    <section className={styles.section}><h2>Implemented controls</h2><ul><li>Server-side session verification and resource-scoped authorization.</li><li>Age-protection downgrade prevention and reviewed educator verification.</li><li>Cross-site mutation blocking, security headers, request correlation, atomic distributed rate limits, and dependency health checks.</li><li>Separate encryption and short retention for exact safety-alert content.</li><li>Privacy-safe structured logs that redact content and direct identifiers.</li><li>Data retention enforcement, export, consent records, and audit trails.</li></ul></section>
    <section className={styles.section}><h2>Assurance</h2><p>See the repository’s threat model and launch checklist for residual gates. Independent penetration testing, child-safety red teaming, restore drills, and jurisdiction-specific legal review remain mandatory before a broad public or district launch.</p><p><Link href="/privacy">Privacy Notice</Link> · <Link href="/accessibility">Accessibility</Link></p></section>
  </div>;
}
