import { FormEvent, useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import styles from "./Community.module.css";

type Signal = { averageMastery: number; needsAttention: boolean; restricted?: boolean; reasons: string[] };
type Student = { id: string; name: string | null; learnerProfile: { gradeLevel: string } | null; signal: Signal };
type Assignment = { id: string; title: string; instructions: string | null; dueAt: string | null; submissions?: Array<{ status: string }> };
type Classroom = {
  id: string; name: string; subject: string; gradeBand: string; joinCode: string;
  memberships: Array<{ student: Student }>;
  assignments: Assignment[];
  teacher?: { name: string | null };
};
type CommunityData = {
  role: "STUDENT" | "GUARDIAN" | "TEACHER";
  roleVerificationStatus?: string;
  classrooms?: Classroom[];
  memberships?: Array<{ classroom: Classroom }>;
  students?: Array<{ relationship: string; student: Student }>;
  guardians?: Array<{ id: string; relationship: string; guardian: { name: string | null } }>;
  invite?: { code: string; expiresAt: string } | null;
  learningLockedUntil?: string | null;
};
type SafetyAlert = {
  id: string;
  learner: { id: string; name: string | null };
  category: string;
  source: string;
  exactAttempt: string | null;
  attemptNumber: number;
  lockedUntil: string | null;
  createdAt: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  responseStatus: string;
  escalationLevel: number;
  deliveries: Array<{ channel: string; status: string; escalationLevel: number }>;
};

export default function CommunityPage() {
  return <RequireAuth><Head><title>Learning community · StudySmart</title></Head><CommunityPortal /></RequireAuth>;
}

function CommunityPortal() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/community");
      const payload = await response.json();
      if (!response.ok) {throw new Error(payload.error ?? "Could not load community.");}
      setData(payload);
      if (["GUARDIAN", "TEACHER"].includes(payload.role)) {
        const safetyResponse = await fetch("/api/safety/notifications", { cache: "no-store" });
        const safetyPayload = await safetyResponse.json();
        if (!safetyResponse.ok) {throw new Error(safetyPayload.error ?? "Could not load safety alerts.");}
        setSafetyAlerts(safetyPayload.alerts ?? []);
      } else {
        setSafetyAlerts([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load community.");
    } finally {setLoading(false);}
  }, []);

  useEffect(() => {void load();}, [load]);

  async function act(payload: Record<string, unknown>) {
    setError(""); setMessage("");
    const response = await fetch("/api/community", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {setError(result.error ?? "That action failed."); return false;}
    setMessage("Saved."); await load(); return true;
  }

  async function reviewSafetyAlert(notificationId: string) {
    setError("");
    const response = await fetch("/api/safety/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-reviewed", notificationId }),
    });
    const result = await response.json();
    if (!response.ok) {setError(result.error ?? "Could not mark that alert reviewed."); return;}
    setSafetyAlerts((current) => current.map((alert) =>
      alert.id === notificationId ? { ...alert, readAt: new Date().toISOString() } : alert
    ));
    setMessage("Safety alert marked as reviewed.");
  }

  async function revealSafetyAlert(notificationId: string) {
    setError("");
    const response = await fetch("/api/safety/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reveal", notificationId }),
    });
    const result = await response.json();
    if (!response.ok) {setError(result.error ?? "Could not securely open that alert."); return;}
    setSafetyAlerts((current) => current.map((alert) =>
      alert.id === notificationId
        ? { ...alert, exactAttempt: result.exactAttempt, readAt: result.readAt }
        : alert
    ));
  }

  async function acknowledgeSafetyAlert(notificationId: string) {
    setError("");
    const response = await fetch("/api/safety/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acknowledge-response", notificationId }),
    });
    const result = await response.json();
    if (!response.ok) {setError(result.error ?? "Could not acknowledge that alert."); return;}
    setSafetyAlerts((current) => current.map((alert) =>
      alert.id === notificationId
        ? { ...alert, acknowledgedAt: result.acknowledgedAt, responseStatus: "RESPONDING" }
        : alert
    ));
    setMessage("Response acknowledged. Reminder escalation has stopped.");
  }

  if (loading && !data) {return <div className={styles.page}><p>Loading your learning community…</p></div>;}
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>Connected learning team</p><h1>Community</h1><p>Students own their learning. Trusted adults see actionable evidence—not surveillance.</p></div>
        <label>My role<select value={data?.role ?? "STUDENT"} onChange={(event) => void act({ action: "set-role", role: event.target.value })}>
          <option value="STUDENT">Student</option><option value="GUARDIAN">Parent / guardian</option><option value="TEACHER">Teacher</option>
        </select></label>
      </header>
      {message && <p className={styles.success}>{message}</p>}{error && <p className={styles.error} role="alert">{error}</p>}
      {data?.role === "TEACHER" && !["VERIFIED", "DOMAIN_VERIFIED"].includes(data.roleVerificationStatus ?? "") && (
        <section className={styles.notice} role="status">
          <div><strong>Educator verification required</strong><p>Classroom creation stays locked until school affiliation is verified.</p></div>
          <Link href="/trust">Open Trust Center</Link>
        </section>
      )}
      {data && ["GUARDIAN", "TEACHER"].includes(data.role) && (
        <SafetyAlerts
          alerts={safetyAlerts}
          onReview={reviewSafetyAlert}
          onReveal={revealSafetyAlert}
          onAcknowledge={acknowledgeSafetyAlert}
        />
      )}
      {data?.role === "TEACHER" && <TeacherPortal data={data} act={act} />}
      {data?.role === "GUARDIAN" && <GuardianPortal data={data} act={act} />}
      {data?.role === "STUDENT" && <StudentPortal data={data} act={act} />}
    </div>
  );
}

function SafetyAlerts({ alerts, onReview, onReveal, onAcknowledge }: {
  alerts: SafetyAlert[];
  onReview: (notificationId: string) => Promise<void>;
  onReveal: (notificationId: string) => Promise<void>;
  onAcknowledge: (notificationId: string) => Promise<void>;
}) {
  const unreadCount = alerts.filter((alert) => !alert.readAt).length;
  return (
    <section className={styles.safetyPanel} aria-labelledby="safety-alerts-title">
      <div className={styles.safetyHead}>
        <div>
          <p className={styles.safetyEyebrow}>Authorized adult access · audited</p>
          <h2 id="safety-alerts-title">Safety alerts</h2>
        </div>
        <span className={styles.unreadBadge}>{unreadCount} new</span>
      </div>
      <p className={styles.safetyIntro}>Sensitive details stay behind a recent-sign-in check. Keep them private and use urgent alerts for a calm, immediate, supportive response.</p>
      {alerts.length === 0 ? (
        <p className={styles.muted}>No safety alerts for your connected learners.</p>
      ) : alerts.map((alert) => (
        <article className={`${styles.safetyAlert} ${alert.readAt ? styles.reviewed : ""}`} key={alert.id}>
          <div className={styles.alertMeta}>
            <div>
              <strong>{alert.learner.name ?? "Connected learner"}</strong>
              <span>
                {alert.category === "SELF_HARM_CONCERN"
                  ? "Urgent self-harm concern · protective alert, not a disciplinary strike"
                  : `${alert.category.replaceAll("_", " ").toLocaleLowerCase()} · strike ${alert.attemptNumber} of 3`}
              </span>
            </div>
            <time dateTime={alert.createdAt}>{new Date(alert.createdAt).toLocaleString()}</time>
          </div>
          <p className={styles.deliveryState}>
            Delivery: {alert.deliveries.length === 0
              ? "in-app only"
              : alert.deliveries
                  .filter((delivery, index, all) =>
                    all.findIndex((item) => item.channel === delivery.channel) === index
                  )
                  .map((delivery) => `${delivery.channel.toLocaleLowerCase()} ${delivery.status.toLocaleLowerCase()}`)
                  .join(" · ")}
            {alert.escalationLevel > 0 ? ` · reminder ${alert.escalationLevel} sent` : ""}
          </p>
          {alert.lockedUntil && <p className={styles.lockedNotice}>Learning access is locked through {new Date(alert.lockedUntil).toLocaleString()}.</p>}
          {alert.exactAttempt ? (
            <div className={styles.attempt}>
              <strong>Exact attempted request</strong>
              <blockquote>{alert.exactAttempt}</blockquote>
            </div>
          ) : (
            <button type="button" onClick={() => void onReveal(alert.id)}>
              Reverify and view sensitive details
            </button>
          )}
          <div className={styles.alertActions}>
            {alert.category === "SELF_HARM_CONCERN" && (
              <button
                type="button"
                disabled={Boolean(alert.acknowledgedAt)}
                onClick={() => void onAcknowledge(alert.id)}
              >
                {alert.acknowledgedAt ? "Response acknowledged" : "I’m responding now"}
              </button>
            )}
            <button type="button" disabled={Boolean(alert.readAt)} onClick={() => void onReview(alert.id)}>
              {alert.readAt ? "Reviewed" : "Mark reviewed"}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function TeacherPortal({ data, act }: { data: CommunityData; act: (payload: Record<string, unknown>) => Promise<boolean> }) {
  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (await act({ action: "create-classroom", name: form.get("name"), subject: form.get("subject"), gradeBand: form.get("gradeBand") })) {event.currentTarget.reset();}
  }
  async function createAssignment(event: FormEvent<HTMLFormElement>, classroomId: string) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (await act({ action: "create-assignment", classroomId, title: form.get("title"), instructions: form.get("instructions"), dueAt: form.get("dueAt") })) {event.currentTarget.reset();}
  }
  return <div className={styles.grid}>
    <section className={styles.panel}><p className={styles.eyebrow}>Teacher workspace</p><h2>Create a classroom</h2><form onSubmit={createClass} className={styles.form}><input name="name" placeholder="Class name" required /><input name="subject" placeholder="Subject" required /><select name="gradeBand" required><option value="">Grade band</option><option>K–2</option><option>3–5</option><option>6–8</option><option>9–12</option></select><button>Create classroom</button></form></section>
    {(data.classrooms ?? []).map((classroom) => <section className={styles.panel} key={classroom.id}>
      <div className={styles.panelHead}><div><p className={styles.eyebrow}>{classroom.subject} · {classroom.gradeBand}</p><h2>{classroom.name}</h2></div><code>{classroom.joinCode}</code></div>
      <h3>Evidence-based interventions</h3>
      {classroom.memberships.length === 0 ? <p className={styles.muted}>Share the class code with students.</p> : classroom.memberships.map(({ student }) => <article className={styles.studentRow} key={student.id}><div><strong>{student.name ?? "Student"}</strong><span>Grade {student.learnerProfile?.gradeLevel ?? "—"}{student.signal.restricted ? "" : ` · ${student.signal.averageMastery}% mastery`}</span></div><div className={student.signal.needsAttention ? styles.alert : styles.steady}>{student.signal.restricted ? student.signal.reasons[0] : student.signal.needsAttention ? student.signal.reasons.join(" · ") : "On track"}</div></article>)}
      <form className={styles.assignmentForm} onSubmit={(event) => createAssignment(event, classroom.id)}><h3>Assign next work</h3><input name="title" placeholder="Assignment title" required /><input name="instructions" placeholder="Instructions" /><input name="dueAt" type="date" /><button>Assign to class</button></form>
      {classroom.assignments.map((assignment) => <p className={styles.assignment} key={assignment.id}><strong>{assignment.title}</strong><span>{assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleDateString()}` : "No due date"}</span></p>)}
    </section>)}
  </div>;
}

function GuardianPortal({ data, act }: { data: CommunityData; act: (payload: Record<string, unknown>) => Promise<boolean> }) {
  return <div className={styles.grid}>
    <section className={styles.panel}><p className={styles.eyebrow}>Family connection</p><h2>Connect a learner</h2><p>Generate a private, one-use code. It expires after seven days.</p>{data.invite ? <div className={styles.invite}><code>{data.invite.code}</code><span>Give this code directly to your student.</span></div> : <button onClick={() => void act({ action: "create-family-invite" })}>Create family code</button>}</section>
    <section className={styles.panel}><p className={styles.eyebrow}>Support without surveillance</p><h2>Learner signals</h2>{(data.students ?? []).length === 0 ? <p className={styles.muted}>No learner connected yet.</p> : data.students?.map(({ student, relationship }) => <article className={styles.studentRow} key={student.id}><div><strong>{student.name ?? "Student"}</strong><span>{relationship} · Grade {student.learnerProfile?.gradeLevel ?? "—"}</span></div><div className={student.signal.needsAttention ? styles.alert : styles.steady}><strong>{student.signal.averageMastery}% mastery</strong>{student.signal.reasons.map((reason) => <span key={reason}>{reason}</span>)}</div></article>)}</section>
  </div>;
}

function StudentPortal({ data, act }: { data: CommunityData; act: (payload: Record<string, unknown>) => Promise<boolean> }) {
  const learningLocked = Boolean(
    data.learningLockedUntil && new Date(data.learningLockedUntil) > new Date()
  );
  async function join(event: FormEvent<HTMLFormElement>, action: string) {event.preventDefault(); const form = new FormData(event.currentTarget); if (await act({ action, code: form.get("code") })) {event.currentTarget.reset();}}
  return <div className={styles.grid}>
    <section className={styles.panel}><p className={styles.eyebrow}>Join your team</p><h2>Connection codes</h2><form className={styles.form} onSubmit={(event) => join(event, "join-classroom")}><input name="code" placeholder="CLASS-…" required /><button>Join classroom</button></form><form className={styles.form} onSubmit={(event) => join(event, "join-family")}><input name="code" placeholder="FAMILY-…" required /><button>Connect guardian</button></form></section>
    {(data.memberships ?? []).map(({ classroom }) => <section className={styles.panel} key={classroom.id}><p className={styles.eyebrow}>{classroom.subject} · {classroom.teacher?.name ?? "Teacher"}</p><h2>{classroom.name}</h2>{learningLocked && <p className={styles.lockedNotice}>Assignment completion is paused. You can still contact your support team.</p>}{classroom.assignments.length === 0 ? <p className={styles.muted}>You’re caught up.</p> : classroom.assignments.map((assignment) => {const done = assignment.submissions?.[0]?.status === "COMPLETED"; return <article className={styles.task} key={assignment.id}><div><strong>{assignment.title}</strong><p>{assignment.instructions}</p><span>{assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleDateString()}` : "Practice when ready"}</span></div><button disabled={done || learningLocked} onClick={() => void act({ action: "complete-assignment", assignmentId: assignment.id })}>{done ? "Completed" : learningLocked ? "Paused" : "Mark complete"}</button></article>;})}</section>)}
    {(data.guardians ?? []).length > 0 && <section className={styles.panel}><p className={styles.eyebrow}>Your support team</p><h2>Connected family</h2>{data.guardians?.map((link) => <p key={link.id}>{link.guardian.name ?? link.relationship} · {link.relationship}</p>)}</section>}
  </div>;
}
