import Head from "next/head";
import styles from "./Policy.module.css";

const providers = [
  ["Vercel", "Application hosting, edge delivery, function logs, and deployment observability", "Configured deployment regions and retention"],
  ["Supabase", "Authentication and PostgreSQL data services", "Account, learning, consent, safety, and operational data"],
  ["OpenAI", "Optional educational generation, moderation, embeddings, transcription, and multimodal extraction", "Only feature inputs needed for enabled AI operations"],
  ["Stripe", "Subscription checkout and billing status", "Adult account and transaction identifiers"],
  ["Resend", "Optional urgent safety email delivery", "Authorized adult email and privacy-safe alert text"],
  ["Twilio", "Optional urgent safety SMS delivery", "Authorized adult phone and privacy-safe alert text"],
  ["Web Push providers", "Optional browser safety notifications", "Device subscription endpoint and privacy-safe alert text"],
];

export default function SubprocessorsPage() {
  return <div className={styles.page}>
    <Head><title>Subprocessors · StudySmart</title></Head>
    <header className={styles.hero}><p className={styles.eyebrow}>Service-provider transparency</p><h1>Subprocessors</h1><p>Providers are used only when their related feature is configured and enabled.</p><p className={styles.meta}>Last updated July 16, 2026</p></header>
    <div className={styles.notice}>Before district or public launch, the operator must complete provider contracts, data-use and training settings, retention, regional processing, subprocessors, security, and breach-term review.</div>
    <section className={styles.section}><table className={styles.table}><thead><tr><th>Provider</th><th>Purpose</th><th>Data category</th></tr></thead><tbody>{providers.map(([provider, purpose, data]) => <tr key={provider}><td>{provider}</td><td>{purpose}</td><td>{data}</td></tr>)}</tbody></table></section>
  </div>;
}
