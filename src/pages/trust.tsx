import { FormEvent, useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import styles from "./Trust.module.css";

type Settings = {
  aiPersonalizationEnabled: boolean;
  productAnalyticsEnabled: boolean;
  shareProgressWithTeachers: boolean;
  shareProgressWithGuardians: boolean;
  tutorHistoryEnabled: boolean;
  dataRetentionDays: number;
  textScale: string;
  reduceMotion: boolean;
  highContrast: boolean;
  readingFont: boolean;
};
type TrustData = {
  user: { accountRole: string; ageGroup: string; roleVerificationStatus: string };
  settings: Settings;
  parentalConsent: boolean;
  verification: { organizationName: string | null; status: string; reviewNote: string | null } | null;
  rightsRequests: Array<{ id: string; requestType: string; status: string; requestedAt: string }>;
  linkedStudents: Array<{
    relationship: string;
    student: { id: string; name: string | null; ageGroup: string; consentsFor: Array<{ id: string }> };
  }>;
  districtPolicy: {
    organizationIds: string[];
    requireGuardianConsent: boolean;
    dataRetentionDays: number | null;
  };
};

export default function TrustPage() {
  return <RequireAuth><Head><title>Trust Center · StudySmart</title></Head><TrustCenter /></RequireAuth>;
}

function TrustCenter() {
  const [data, setData] = useState<TrustData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/trust");
    const payload = await response.json();
    if (!response.ok) {throw new Error(payload.error ?? "Could not load the Trust Center.");}
    setData(payload);
  }, []);
  useEffect(() => {load().catch((loadError: Error) => setError(loadError.message));}, [load]);

  async function act(payload: Record<string, unknown>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/trust", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {throw new Error(result.error ?? "Could not save that change.");}
      setMessage(success); await load(); return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not save that change.");
      return false;
    } finally {setBusy(false);}
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) {return;}
    const form = new FormData(event.currentTarget);
    const payload = {
      action: "update-settings",
      aiPersonalizationEnabled: form.has("aiPersonalizationEnabled"),
      productAnalyticsEnabled: form.has("productAnalyticsEnabled"),
      shareProgressWithTeachers: form.has("shareProgressWithTeachers"),
      shareProgressWithGuardians: form.has("shareProgressWithGuardians"),
      tutorHistoryEnabled: form.has("tutorHistoryEnabled"),
      dataRetentionDays: Number(form.get("dataRetentionDays")),
      textScale: form.get("textScale"),
      reduceMotion: form.has("reduceMotion"),
      highContrast: form.has("highContrast"),
      readingFont: form.has("readingFont"),
    };
    if (await act(payload, "Privacy and accessibility preferences saved.")) {
      applyPreferences(payload);
    }
  }

  async function verifyTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await act({ action: "request-role-verification", organizationName: form.get("organizationName") }, "Verification request submitted.");
  }

  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (await act({ action: "report-safety-concern", category: form.get("category"), details: form.get("details") }, "Safety concern recorded for review.")) {event.currentTarget.reset();}
  }

  if (!data) {return <div className={styles.page}><p role="status">Loading Trust Center…</p>{error && <p role="alert">{error}</p>}</div>;}
  const consentRequired = data.user.ageGroup === "UNDER_13" || data.districtPolicy.requireGuardianConsent;
  const aiReady = data.user.ageGroup !== "UNKNOWN" && (!consentRequired || data.parentalConsent);
  return <div className={styles.page}>
    <header className={styles.hero}><p className={styles.eyebrow}>Privacy · Safety · Accessibility</p><h1>Trust Center</h1><p>Clear controls for learners and families. Safety logs keep one-way fingerprints; exact blocked requests are separately encrypted for authorized alerts and automatically purged on a short retention schedule.</p></header>
    <div className={styles.statusGrid} aria-label="Trust status">
      <Status title="AI access" value={aiReady ? "Ready" : data.user.ageGroup === "UNKNOWN" ? "Age group needed" : "Guardian consent needed"} good={aiReady} />
      <Status title="Account role" value={data.user.accountRole.toLowerCase()} good />
      <Status title="Adult verification" value={data.user.roleVerificationStatus.toLowerCase().replaceAll("_", " ")} good={["VERIFIED", "DOMAIN_VERIFIED", "NOT_REQUIRED", "SELF_ATTESTED"].includes(data.user.roleVerificationStatus)} />
    </div>
    <div className={styles.feedback} aria-live="polite">{message && <p className={styles.success}>{message}</p>}{error && <p className={styles.error} role="alert">{error}</p>}</div>

    <section className={styles.panel}><h2>Age-appropriate protection</h2><p>StudySmart uses an age group—not a birth date—to minimize personal data. Moving to a less protective group requires a reviewed correction.</p><label className={styles.field}>Age group<select value={data.user.ageGroup} onChange={(event) => void act({ action: "update-age-group", ageGroup: event.target.value }, "Age group saved.")} disabled={busy}><option value="UNKNOWN">Choose one</option><option value="UNDER_13">Under 13</option><option value="TEEN">13–17</option><option value="ADULT">18 or older</option></select></label>{consentRequired && !data.parentalConsent && <div className={styles.notice} role="status"><strong>Guardian approval needed</strong><p>Connect a parent or guardian in Community. They can review the notice and approve AI tutoring here.</p></div>}</section>

    {data.user.accountRole === "GUARDIAN" && <section className={styles.panel}><h2>Parental consent</h2><p>Approval covers educational AI processing and personalized learning. It can be withdrawn at any time.</p>{data.linkedStudents.length === 0 ? <p className={styles.muted}>Connect a learner from Community first.</p> : data.linkedStudents.map(({ student, relationship }) => {const granted = student.consentsFor.length > 0; return <div className={styles.consentRow} key={student.id}><div><strong>{student.name ?? "Connected learner"}</strong><span>{relationship} · {student.ageGroup.toLowerCase().replace("_", " ")}</span></div><button type="button" disabled={busy} onClick={() => void act({ action: granted ? "revoke-parental-consent" : "grant-parental-consent", studentId: student.id }, granted ? "Consent withdrawn." : "Parental consent recorded.")}>{granted ? "Withdraw consent" : "Review and approve"}</button></div>;})}</section>}

    {data.user.accountRole === "GUARDIAN" && <GuardianSafetyDelivery />}

    {data.user.accountRole === "TEACHER" && <section className={styles.panel}><h2>Educator verification</h2><p>School-domain email ownership can be verified automatically. Public email domains require manual review.</p><form className={styles.inlineForm} onSubmit={verifyTeacher}><label className={styles.field}>School or district name<input name="organizationName" defaultValue={data.verification?.organizationName ?? ""} required maxLength={160} /></label><button disabled={busy}>Submit verification</button></form>{data.verification && <p className={styles.muted}>Status: {data.verification.status.toLowerCase().replaceAll("_", " ")}. {data.verification.reviewNote}</p>}</section>}

    <form className={styles.panel} onSubmit={saveSettings}><h2>Privacy and accessibility controls</h2>{data.districtPolicy.dataRetentionDays && <p className={styles.muted}>Your district caps content retention at {data.districtPolicy.dataRetentionDays} days. Your shorter choice always wins.</p>}<div className={styles.settingsGrid}>
      <Setting name="aiPersonalizationEnabled" defaultChecked={data.settings.aiPersonalizationEnabled} title="Personalized AI" description="Use mastery and grade level to adapt learning." />
      <Setting name="productAnalyticsEnabled" defaultChecked={data.settings.productAnalyticsEnabled} title="Optional product analytics" description="Off by default. Never used for advertising." />
      <Setting name="shareProgressWithTeachers" defaultChecked={data.settings.shareProgressWithTeachers} title="Share progress with teachers" description="Allow connected teachers to see mastery signals." />
      <Setting name="shareProgressWithGuardians" defaultChecked={data.settings.shareProgressWithGuardians} title="Share progress with guardians" description="Allow connected guardians to see progress signals." />
      <Setting name="tutorHistoryEnabled" defaultChecked={data.settings.tutorHistoryEnabled} title="Save tutor history" description="When off, new tutor conversations are not stored." />
      <Setting name="reduceMotion" defaultChecked={data.settings.reduceMotion} title="Reduce motion" description="Remove nonessential animation and movement." />
      <Setting name="highContrast" defaultChecked={data.settings.highContrast} title="High contrast" description="Increase contrast and strengthen interface boundaries." />
      <Setting name="readingFont" defaultChecked={data.settings.readingFont} title="Reading-friendly font" description="Use wider letter spacing and highly distinct letterforms." />
    </div><div className={styles.selectGrid}><label className={styles.field}>Text size<select name="textScale" defaultValue={data.settings.textScale}><option value="DEFAULT">Default</option><option value="LARGE">Large</option><option value="EXTRA_LARGE">Extra large</option></select></label><label className={styles.field}>Tutor and uploaded-content retention<select name="dataRetentionDays" defaultValue={data.settings.dataRetentionDays}><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select></label></div><button className={styles.primary} disabled={busy}>Save preferences</button></form>

    <section className={styles.panel}><h2>Your data rights</h2><p>Download a machine-readable copy immediately, or request correction, restriction, or deletion. Deletion requests are reviewed before irreversible removal.</p><div className={styles.actions}><Link href="/api/privacy/export" download>Download my data</Link><button type="button" onClick={() => void act({ action: "request-data-right", requestType: "CORRECT" }, "Correction request opened.")}>Request correction</button><button type="button" onClick={() => void act({ action: "request-data-right", requestType: "RESTRICT" }, "Processing restriction requested.")}>Restrict processing</button><button className={styles.danger} type="button" onClick={() => void act({ action: "request-data-right", requestType: "DELETE" }, "Deletion request opened.")}>Request deletion</button></div>{data.rightsRequests.map((request) => <p className={styles.request} key={request.id}>{request.requestType.toLowerCase()} · {request.status.toLowerCase()} · {new Date(request.requestedAt).toLocaleDateString()}</p>)}</section>

    <section className={styles.panel}><h2>Report a safety concern</h2><p>Reports retain a short review summary, remove common contact details, and keep a one-way fingerprint for duplicate detection. Include only what reviewers need.</p><form className={styles.reportForm} onSubmit={report}><label className={styles.field}>Concern type<select name="category"><option>Unsafe AI response</option><option>Privacy concern</option><option>Bullying or harassment</option><option>Adult identity concern</option><option>Other</option></select></label><label className={styles.field}>What happened?<textarea name="details" rows={4} maxLength={2000} required /></label><button disabled={busy}>Send safety report</button></form></section>
  </div>;
}

function Status({ title, value, good }: { title: string; value: string; good: boolean }) {return <div className={styles.status}><span>{title}</span><strong className={good ? styles.good : styles.review}>{value}</strong></div>;}
function Setting({ name, defaultChecked, title, description }: { name: string; defaultChecked: boolean; title: string; description: string }) {return <label className={styles.setting}><input type="checkbox" name={name} defaultChecked={defaultChecked} /><span><strong>{title}</strong><small>{description}</small></span></label>;}

type SafetyDeliverySettings = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  hasPhone: boolean;
  hasPushSubscription: boolean;
  vapidPublicKey: string | null;
};

function GuardianSafetyDelivery() {
  const [settings, setSettings] = useState<SafetyDeliverySettings | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/safety/preferences", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {throw new Error(payload.error ?? "Could not load alert delivery settings.");}
    setSettings(payload);
  }, []);
  useEffect(() => {void load().catch((cause: Error) => setError(cause.message));}, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setStatus("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/safety/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        emailEnabled: form.has("emailEnabled"),
        smsEnabled: form.has("smsEnabled"),
        phone: form.get("phone"),
        hasPhone: settings?.hasPhone,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {setError(payload.error ?? "Could not save alert delivery settings."); return;}
    setStatus("Urgent alert delivery settings saved.");
    await load();
  }

  async function enablePush() {
    setError(""); setStatus("");
    if (!settings?.vapidPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Browser push is unavailable or has not been configured on this deployment.");
      return;
    }
    const registration = await navigator.serviceWorker.register("/safety-sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(settings.vapidPublicKey),
    });
    const response = await fetch("/api/safety/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "subscribe-push", subscription: subscription.toJSON() }),
    });
    const payload = await response.json();
    if (!response.ok) {setError(payload.error ?? "Could not enable browser push."); return;}
    setStatus("Browser push alerts enabled.");
    await load();
  }

  if (!settings) {return <section className={styles.panel}><h2>Urgent safety alert delivery</h2><p>{error || "Loading secure delivery settings…"}</p></section>;}
  return <section className={styles.panel} aria-labelledby="safety-delivery-title">
    <h2 id="safety-delivery-title">Urgent safety alert delivery</h2>
    <p>Alert previews never contain a learner’s sensitive request. Sign in to the secure Safety Alerts center to view details.</p>
    {status && <p className={styles.success} role="status">{status}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <form className={styles.reportForm} onSubmit={save}>
      <Setting name="emailEnabled" defaultChecked={settings.emailEnabled} title="Email alerts" description="Recommended. Uses the verified account email." />
      <Setting name="smsEnabled" defaultChecked={settings.smsEnabled} title="SMS alerts" description="Optional. The mobile number is encrypted at rest." />
      <label className={styles.field}>Mobile number in international format
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={settings.hasPhone ? "Saved securely · enter only to replace" : "+15551234567"} />
      </label>
      <button type="submit">Save delivery settings</button>
    </form>
    <div className={styles.pushRow}>
      <div><strong>Browser push</strong><p>{settings.hasPushSubscription ? "Enabled on at least one device." : "Receive a privacy-safe lock-screen alert."}</p></div>
      <button type="button" disabled={settings.hasPushSubscription} onClick={() => void enablePush()}>{settings.hasPushSubscription ? "Push enabled" : "Enable push"}</button>
    </div>
  </section>;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function applyPreferences(settings: Record<string, unknown>) {
  document.body.dataset.textScale = String(settings.textScale ?? "DEFAULT");
  document.body.dataset.reduceMotion = String(Boolean(settings.reduceMotion));
  document.body.dataset.highContrast = String(Boolean(settings.highContrast));
  document.body.dataset.readingFont = String(Boolean(settings.readingFont));
}
