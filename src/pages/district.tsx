import { FormEvent, useCallback, useEffect, useState } from "react";
import Head from "next/head";
import RequireAuth from "@/components/RequireAuth";
import styles from "./District.module.css";

type Policy = {
  allowedGradeBands: string[];
  aiTutorEnabled: boolean;
  multimodalEnabled: boolean;
  externalKnowledgeEnabled: boolean;
  requireGuardianConsent: boolean;
  dataRetentionDays: number;
  safetyAlertChannels: string[];
  policyVersion: number;
};
type Membership = {
  id: string;
  role: string;
  organization: {
    id: string;
    name: string;
    verifiedDomain: string | null;
    policy: Policy;
    memberships: Array<{
      id: string;
      role: string;
      user: { name: string | null; email: string; roleVerificationStatus: string };
    }>;
    _count: { classrooms: number };
  };
};

export default function DistrictPage() {
  return <RequireAuth><Head><title>District controls · StudySmart</title></Head><DistrictControls /></RequireAuth>;
}

function DistrictControls() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [eligible, setEligible] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/district", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {throw new Error(payload.error ?? "Could not load district controls.");}
    setMemberships(payload.memberships ?? []);
    setEligible(Boolean(payload.eligibleToCreate));
  }, []);
  useEffect(() => {void load().catch((cause: Error) => setError(cause.message));}, [load]);

  async function act(payload: Record<string, unknown>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/district", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {throw new Error(result.error ?? "Could not save district settings.");}
      setMessage(success); await load();
    } catch (cause) {setError(cause instanceof Error ? cause.message : "Could not save district settings.");}
    finally {setBusy(false);}
  }

  if (memberships.length === 0) {
    return <div className={styles.page}>
      <header className={styles.hero}><p>Verified K–12 administration</p><h1>District controls</h1><span>Create governed learning spaces with conservative defaults, audit trails, and enforceable policy.</span></header>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {eligible ? <form className={styles.panel} onSubmit={(event) => {event.preventDefault(); const form = new FormData(event.currentTarget); void act({ action: "create-organization", name: form.get("name") }, "District workspace created.");}}>
        <h2>Create your verified workspace</h2><label>District or school name<input name="name" required maxLength={160} /></label><button disabled={busy}>Create secure workspace</button>
      </form> : <section className={styles.panel}><h2>Domain verification required</h2><p>Verify a K–12 organization email in the Trust Center. Existing workspace members must be invited by their district administrator.</p></section>}
    </div>;
  }

  return <div className={styles.page}>
    <header className={styles.hero}><p>Verified K–12 administration</p><h1>District controls</h1><span>Policy changes are versioned and written to the security audit log.</span></header>
    <div aria-live="polite">{message && <p className={styles.success}>{message}</p>}{error && <p role="alert" className={styles.error}>{error}</p>}</div>
    {memberships.map((membership) => <OrganizationPanel key={membership.id} membership={membership} busy={busy} act={act} />)}
  </div>;
}

function OrganizationPanel({ membership, busy, act }: {
  membership: Membership;
  busy: boolean;
  act: (payload: Record<string, unknown>, success: string) => Promise<void>;
}) {
  const organization = membership.organization;
  const policy = organization.policy;
  const canManage = ["OWNER", "ADMIN"].includes(membership.role);
  function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    return act({
      action: "update-policy", organizationId: organization.id,
      allowedGradeBands: form.getAll("allowedGradeBands"),
      aiTutorEnabled: form.has("aiTutorEnabled"), multimodalEnabled: form.has("multimodalEnabled"),
      externalKnowledgeEnabled: form.has("externalKnowledgeEnabled"), requireGuardianConsent: form.has("requireGuardianConsent"),
      dataRetentionDays: Number(form.get("dataRetentionDays")), safetyAlertChannels: form.getAll("safetyAlertChannels"),
      lockedSettings: form.getAll("lockedSettings"),
    }, "District policy updated.");
  }
  return <>
    <section className={styles.summary}><div><p>{organization.verifiedDomain} · {membership.role.toLowerCase()}</p><h2>{organization.name}</h2></div><strong>{organization._count.classrooms} classrooms · policy v{policy.policyVersion}</strong></section>
    <form className={styles.panel} onSubmit={savePolicy}>
      <h2>Learning and data policy</h2>
      <fieldset disabled={!canManage || busy}><legend>Allowed grade bands</legend><div className={styles.checks}>{["K–2", "3–5", "6–8", "9–12"].map((band) => <label key={band}><input type="checkbox" name="allowedGradeBands" value={band} defaultChecked={policy.allowedGradeBands.includes(band)} />{band}</label>)}</div></fieldset>
      <div className={styles.settings}>
        <Toggle name="aiTutorEnabled" checked={policy.aiTutorEnabled} label="AI tutoring" />
        <Toggle name="multimodalEnabled" checked={policy.multimodalEnabled} label="Image, audio, and video processing" />
        <Toggle name="externalKnowledgeEnabled" checked={policy.externalKnowledgeEnabled} label="General-knowledge tutor mode" />
        <Toggle name="requireGuardianConsent" checked={policy.requireGuardianConsent} label="Require guardian consent for enrolled learners" />
      </div>
      <label>Maximum learner-content retention<select name="dataRetentionDays" defaultValue={policy.dataRetentionDays} disabled={!canManage || busy}><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select></label>
      <fieldset disabled={!canManage || busy}><legend>Safety alert channels</legend><div className={styles.checks}>{["IN_APP", "EMAIL", "SMS", "PUSH"].map((channel) => <label key={channel}><input type="checkbox" name="safetyAlertChannels" value={channel} defaultChecked={policy.safetyAlertChannels.includes(channel)} disabled={channel === "IN_APP"} />{channel.replace("_", " ").toLowerCase()}</label>)}</div></fieldset>
      {canManage && <button disabled={busy}>Save governed policy</button>}
    </form>
    <section className={styles.panel}><h2>Verified educators</h2>{organization.memberships.map((member) => <div className={styles.member} key={member.id}><span><strong>{member.user.name ?? member.user.email}</strong><small>{member.user.email} · {member.role.toLowerCase()}</small></span>{canManage && member.role !== "OWNER" && <button type="button" disabled={busy} onClick={() => void act({ action: "deactivate-member", organizationId: organization.id, memberId: member.id }, "Educator access deactivated.")}>Deactivate</button>}</div>)}{canManage && <form className={styles.invite} onSubmit={(event) => {event.preventDefault(); const form = new FormData(event.currentTarget); void act({ action: "add-member", organizationId: organization.id, email: form.get("email"), role: form.get("role") }, "Verified educator added.");}}><label>Verified educator email<input type="email" name="email" required /></label><label>District role<select name="role"><option value="TEACHER">Teacher</option><option value="ADMIN">Administrator</option></select></label><button disabled={busy}>Add educator</button></form>}</section>
  </>;
}

function Toggle({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return <label><input type="checkbox" name={name} defaultChecked={checked} />{label}</label>;
}
