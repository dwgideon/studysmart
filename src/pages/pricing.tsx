import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PLAN_CATALOG, type PaidPlanKey } from "@/lib/plans";
import { supabase } from "@/lib/supabaseClient";
import styles from "./Pricing.module.css";

type Entitlement = { plan: string; limit: number; used: number; remaining: number };
type Learner = { id: string; name: string; gradeLevel: string | null; entitlement?: Entitlement };
type BillingStatus = {
  canPurchase: boolean;
  purchaseRequiresGuardian: boolean;
  canManageBilling: boolean;
  learners: Learner[];
};

const FEATURES: Record<PaidPlanKey, string[]> = {
  starter: ["200 AI credits each month", "Grounded tutoring and study-set creation", "All solo games and live friend rooms", "Mastery and spaced-review planning"],
  pro: ["500 AI credits each month", "More document, image, and audio processing", "Everything in Starter", "Built for frequent weekly studying"],
  unlimited: ["2,000 AI credits each month", "High-volume test preparation", "Everything in Pro", "Fair-use protection against automated abuse"],
};

const PAID_KEYS: PaidPlanKey[] = ["starter", "pro", "unlimited"];

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanKey | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [message, setMessage] = useState("");
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    setCancelled(new URLSearchParams(window.location.search).get("status") === "cancel");
    void fetch("/api/billing/status")
      .then(async (response) => response.ok ? response.json() as Promise<BillingStatus> : null)
      .then((status) => {
        if (!status) {return;}
        setBilling(status);
        setSelectedLearnerId(status.learners[0]?.id ?? "");
      });
  }, []);

  const selectedLearner = useMemo(
    () => billing?.learners.find((learner) => learner.id === selectedLearnerId),
    [billing, selectedLearnerId]
  );

  const handleCheckout = useCallback(async (planKey: PaidPlanKey) => {
    setMessage("");
    setLoadingPlan(planKey);
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      window.location.href = "/login?next=/pricing";
      return;
    }
    if (!billing?.canPurchase || !selectedLearnerId) {
      setLoadingPlan(null);
      setMessage("A connected parent or guardian must manage paid plans for learners under 18.");
      return;
    }
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceKey: planKey, beneficiaryUserId: selectedLearnerId }),
    });
    const result = await response.json();
    setLoadingPlan(null);
    if (result.url) {window.location.href = result.url;}
    else {setMessage(result.error || "Checkout is temporarily unavailable.");}
  }, [billing, selectedLearnerId]);

  const manageBilling = useCallback(async () => {
    setMessage("");
    const response = await fetch("/api/stripe/create-portal-session", { method: "POST" });
    const result = await response.json();
    if (result.url) {window.location.href = result.url;}
    else {setMessage(result.error || "Billing management is temporarily unavailable.");}
  }, []);

  return <div className={styles.wrap}>
    <Head><title>StudySmart plans</title><meta name="description" content="Safe, transparent K–12 study plans with cost-controlled AI tutoring and test preparation." /></Head>
    <section className={styles.header}>
      <h1>Powerful studying. Predictable pricing.</h1>
      <p>Reviewing saved material, mastery tracking, spaced repetition, and earned games never consume AI credits. Credits are used only when StudySmart creates new AI-powered tutoring or study content.</p>
      {cancelled ? <p className={styles.notice}>Checkout cancelled. Nothing was charged.</p> : null}
      {message ? <p className={styles.error} role="alert">{message}</p> : null}
      {billing?.purchaseRequiresGuardian ? <p className={styles.guardianNotice}>Paid plans for learners under 18 are purchased from a connected guardian account.</p> : null}
      {billing && billing.learners.length > 1 ? <label className={styles.learnerPicker}>Choose learner
        <select value={selectedLearnerId} onChange={(event) => setSelectedLearnerId(event.target.value)}>
          {billing.learners.map((learner) => <option value={learner.id} key={learner.id}>{learner.name}{learner.gradeLevel ? ` · Grade ${learner.gradeLevel}` : ""}</option>)}
        </select>
      </label> : null}
      {selectedLearner?.entitlement ? <div className={styles.usage}>
        <strong>{selectedLearner.entitlement.remaining}</strong> of {selectedLearner.entitlement.limit} AI credits remaining this month
      </div> : null}
      {billing?.canManageBilling ? <button className={styles.manage} onClick={() => void manageBilling()}>Manage billing</button> : null}
    </section>

    <section className={styles.cards} aria-label="StudySmart plans">
      <article className={styles.card}>
        <div className={styles.cardHead}><h2>{PLAN_CATALOG.free.name}</h2><p className={styles.blurb}>{PLAN_CATALOG.free.description}</p><div className={styles.priceRow}><span className={styles.price}>$0</span><span className={styles.period}>forever</span></div></div>
        <ul className={styles.list}><li>25 AI credits each month</li><li>Unlimited review of saved cards and quizzes</li><li>Solo games and friend rooms</li><li>Mastery and spaced-review tracking</li></ul>
        <button className={styles.secondaryCta} onClick={() => {window.location.href = "/login";}}>Start free</button>
      </article>
      {PAID_KEYS.map((key) => {
        const plan = PLAN_CATALOG[key];
        return <article className={`${styles.card} ${key === "starter" ? styles.highlight : ""}`} key={key}>
          {key === "starter" ? <span className={styles.badge}>Recommended</span> : null}
          <div className={styles.cardHead}><h2>{plan.name}</h2><p className={styles.blurb}>{plan.description}</p><div className={styles.priceRow}><span className={styles.price}>${(plan.monthlyPriceCents / 100).toFixed(2)}</span><span className={styles.period}>/month</span></div></div>
          <ul className={styles.list}>{FEATURES[key].map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <button className={styles.cta} disabled={loadingPlan !== null || billing?.canPurchase === false} onClick={() => void handleCheckout(key)}>{loadingPlan === key ? "Opening secure checkout…" : `Choose ${plan.name}`}</button>
        </article>;
      })}
    </section>
    <section className={styles.explainer}><h2>How AI credits work</h2><p>A tutor response uses 1 credit. A new quiz or diagnostic uses 2. Text study-set processing generally uses 3. Documents or images generally use 12, while audio or video study sets can use 22 because transcription costs more to run. Limits reset monthly; StudySmart never silently charges overages.</p><p>By choosing a paid plan, the purchasing adult agrees to the <Link href="/terms">Terms of Service</Link> and acknowledges the <Link href="/privacy">Privacy Notice</Link>.</p></section>
  </div>;
}
