import Head from "next/head";
import RequireAuth from "@/components/RequireAuth";
import LearningContextForm from "@/components/LearningContextForm";
import styles from "./Onboarding.module.css";

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <Head>
        <title>Personalize your learning · StudySmart</title>
      </Head>
      <div className={styles.page}>
        <section className={styles.card} aria-labelledby="onboarding-title">
          <div className={styles.eyebrow}>Your learning, personalized</div>
          <h1 id="onboarding-title">Let’s build your study plan</h1>
          <p className={styles.intro}>
            Tell us where you are and what you’re working toward. You can change
            any of this later.
          </p>
          <LearningContextForm redirectAfterSave="/diagnostic" />
        </section>
      </div>
    </RequireAuth>
  );
}
