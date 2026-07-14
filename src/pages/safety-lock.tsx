import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import styles from "./SafetyLock.module.css";

type LockStatus = {
  locked: boolean;
  strikeCount: number;
  lockedUntil: string | null;
};

export default function SafetyLockPage() {
  return (
    <RequireAuth>
      <Head><title>Learning tools paused · StudySmart</title></Head>
      <SafetyLockNotice />
    </RequireAuth>
  );
}

function SafetyLockNotice() {
  const [status, setStatus] = useState<LockStatus | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/safety/status", { cache: "no-store" })
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setError("The safety status could not be loaded."));
  }, []);

  async function appeal() {
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/safety/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "appeal" }),
    });
    const result = await response.json();
    if (response.ok) {
      setMessage("Your appeal was submitted for adult review. The pause stays active until it is reviewed or reaches its end date.");
    } else {
      setError(result.error ?? "The appeal could not be submitted.");
    }
    setSubmitting(false);
  }

  if (!status && !error) {
    return <div className={styles.page} role="status">Loading safety status…</div>;
  }
  if (status && !status.locked) {
    return <div className={styles.page}><section className={styles.card}><p className={styles.eyebrow}>Safety status</p><h1>Your learning tools are available</h1><p>The temporary pause is not active.</p><Link className={styles.primary} href="/dashboard">Return to dashboard</Link></section></div>;
  }

  const endDate = status?.lockedUntil
    ? new Date(status.lockedUntil).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })
    : "the date shown in your safety alert";
  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="safety-lock-title">
        <div className={styles.icon} aria-hidden="true">!</div>
        <p className={styles.eyebrow}>Learning tools paused</p>
        <h1 id="safety-lock-title">Take a safety reset</h1>
        <p className={styles.lead}>Three prohibited-content attempts were blocked. Study and practice tools are paused for 30 days, through <strong>{endDate}</strong>.</p>
        <div className={styles.notice}>
          <h2>What happens now</h2>
          <ul>
            <li>Connected parents, guardians, and verified teachers receive the safety alerts.</li>
            <li>You can still reach your support team and manage privacy or consent.</li>
            <li>Your learning access returns automatically when the pause ends unless an appeal changes the decision sooner.</li>
          </ul>
        </div>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/community">Open Community</Link>
          <Link className={styles.secondary} href="/trust">Open Trust Center</Link>
        </div>
        <button className={styles.appeal} type="button" onClick={appeal} disabled={submitting || Boolean(message)}>
          {submitting ? "Submitting…" : message ? "Appeal submitted" : "Appeal this decision"}
        </button>
        {message && <p className={styles.success} role="status">{message}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    </div>
  );
}
