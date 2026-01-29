import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Landing.module.css";
import Header from "@/components/Header";

export default function Home() {
  return (
    <>
      <Head>
        <title>StudySmart – Turn Notes into Mastery</title>
        <meta
          name="description"
          content="Upload your notes and instantly get AI-generated flashcards, quizzes, and study guides."
        />
      </Head>

      <Header />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            Study Smarter. <span>Every Time.</span>
          </h1>

          <p className={styles.subtitle}>
            Upload your notes and let AI create flashcards, quizzes, and study
            guides—personalized to your pace.
          </p>

          <div className={styles.heroActions}>
            <Link href="/upload" className={styles.primaryBtn}>
              Start Studying
            </Link>
            <Link href="/pricing" className={styles.secondaryBtn}>
              See Plans
            </Link>
          </div>

          <p className={styles.trustLine}>
            Built for students. Trusted by parents.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <h2>Why students love StudySmart</h2>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.icon}>🎯</div>
            <h3>Depth Control</h3>
            <p>
              Pick Minimum, Medium, or Maximum coverage. Study exactly what you
              need.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.icon}>🧠</div>
            <h3>Smart Explanations</h3>
            <p>
              Every answer includes clear explanations so you actually learn.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.icon}>⚡</div>
            <h3>Modern Flashcards</h3>
            <p>
              Interactive study with progress tracking and adaptive review.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Turn notes into mastery in minutes</h2>
        <p>Upload → Generate → Master 🚀</p>

        <Link href="/upload" className={styles.primaryBtn}>
          Try It Free
        </Link>
      </section>
    </>
  );
}
