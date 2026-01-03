import Head from 'next/head';
import styles from './Pricing.module.css';
import { supabase } from '../lib/supabaseClient';
import { useCallback } from 'react';

type PlanKey = 'starter' | 'pro' | 'unlimited';

type Plan = {
  key: PlanKey;
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$9.99',
    period: 'month',
    blurb: 'Great for casual learners',
    features: ['200 generations/month', 'Basic analytics', 'Email support'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19.99',
    period: 'month',
    blurb: 'For regular studying',
    features: ['500 generations/month', 'Priority processing', 'Priority support'],
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    price: '$29.99',
    period: 'month',
    blurb: 'Heavy studying (fair-use cap 2,000)',
    features: ['Up to 2,000 generations/month', 'Fastest processing', 'Priority support'],
    highlight: true,
  },
];

export default function Pricing() {
  const handleCheckout = useCallback(async (planKey: PlanKey) => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      alert('Please log in first.');
      window.location.href = '/login';
      return;
    }

    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceKey: planKey,
        user: { id: user.id, email: user.email },
      }),
    });

    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else alert(json.error || 'Checkout error');
  }, []);

  return (
    <div className={styles.wrap}>
      <Head><title>Pricing – StudySmart</title></Head>

      <section className={styles.header}>
        <h1>Simple, affordable pricing</h1>
        <p>Start with Starter, scale to Pro, or go Unlimited with a fair-use cap.</p>
      </section>

      <section className={styles.cards}>
        {PLANS.map((p) => (
          <div className={`${styles.card} ${p.highlight ? styles.highlight : ''}`} key={p.key}>
            <div className={styles.cardHead}>
              <h3>{p.name}</h3>
              <p className={styles.blurb}>{p.blurb}</p>
              <div className={styles.priceRow}>
                <span className={styles.price}>{p.price}</span>
                <span className={styles.period}>/{p.period}</span>
              </div>
            </div>
            <ul className={styles.list}>
              {p.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <button className={styles.cta} onClick={() => handleCheckout(p.key)}>
              Choose {p.name}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

