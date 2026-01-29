import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Landing.module.css";

export default function Landing() {
  return (
    <>
      <Head>
        <title>StudySmart – Turn Notes into Mastery</title>
        <meta
          name="description"
          content="Upload notes or images and instantly get AI-generated flashcards, quizzes, and study guides."
        />
      </Head>

      {/* HERO */}
      <section className={styles.heroWrap}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <div className={styles.heroText}>
              <h1 className={styles.h1}>
                Study Smarter. <span className={styles.accent}>Every Time.</span>
              </h1>

              <p className={styles.subtitle}>
                Upload your notes and let AI create flashcards, quizzes, and
                study guides—personalized to your pace.
              </p>

              <div className={styles.actions}>
                <Link
                  href="/upload"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Start Studying
                </Link>

                <Link
                  href="/pricing"
                  className={`${styles.btn} ${styles.btnGhost}`}
                >
                  See Plans
                </Link>
              </div>

              <p className={styles.note}>
                Built for students. Trusted by parents.
              </p>
            </div>

            {/* PREVIEW */}
            <div className={styles.preview}>
              <div className={styles.previewHead}>
                <div className={styles.tabs}>
                  <span className={`${styles.tab} ${styles.tabActive}`}>
                    Flashcards
                  </span>
                  <span className={styles.tab}>Quizzes</span>
                  <span className={styles.tab}>Study Guide</span>
                </div>
                <span className={styles.badge}>Live Preview</span>
              </div>

              <div className={styles.previewBody}>
                <div className={styles.previewStage}>
                  Upload → Generate → Master 🚀
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.fadeBottom} />
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Why students love StudySmart</h2>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Depth Control</h3>
              <p className={styles.cardText}>
                Pick Minimum, Medium, or Maximum coverage. Study exactly what you
                need.
              </p>
            </article>

            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Smart Explanations</h3>
              <p className={styles.cardText}>
                Every answer includes clear explanations so you actually learn.
              </p>
            </article>

            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Modern Flashcards</h3>
              <p className={styles.cardText}>
                Interactive study with progress tracking and adaptive review.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaBand}>
        <div className={styles.container}>
          <div className={styles.ctaInner}>
            <div>
              <h3 className={styles.ctaTitle}>
                Ready to level up your studying?
              </h3>
              <p className={styles.ctaText}>
                Start free. Upgrade only if you love it.
              </p>
            </div>

            <Link
              href="/upload"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <span>© {new Date().getFullYear()} StudySmart</span>

          <div className={styles.footerLinks}>
            <Link href="/pricing">Pricing</Link>
            <a href="mailto:support@studysmart.ai">Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}
