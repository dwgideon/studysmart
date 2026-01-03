import Head from 'next/head';
import Link from 'next/link';
import styles from './Landing.module.css';


export default function Landing() {
  return (
    <div className={styles.page}>
      <Head>
        <title>StudySmart – Turn Notes into Mastery</title>
        <meta
          name="description"
          content="Upload notes or images and instantly get AI-generated flashcards, quizzes, and study guides."
        />
      </Head>

      {/* Hero */}
      <section className={`${styles.heroWrap} ${styles.fadeIn}`}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <div className={`${styles.heroText} ${styles.fadeIn}`}>
              <h1 className={styles.h1}>
                Study Smarter. <span className={styles.accent}>Every Time.</span>
              </h1>
              <p className={styles.subtitle}>
                Upload your notes and let AI create flashcards, quizzes, and study guides—personalized to your pace.
              </p>
              <div className={styles.actions}>
                <Link href="/pricing" className={`${styles.btn} ${styles.btnPrimary}`}>
                  See Plans
                </Link>
                <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
                  Try Free
                </Link>
              </div>
              <p className={styles.note}>Fast. Personalized. AI-Powered.</p>
            </div>

            <div className={`${styles.preview} ${styles.fadeIn}`}>
              <div className={styles.previewHead}>
                <div className={styles.tabs}>
                  <span className={`${styles.tab} ${styles.tabActive}`}>Flashcards</span>
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

      {/* Features */}
      <section className={`${styles.features} ${styles.fadeIn}`}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Why students love StudySmart</h2>
          <div className={styles.grid}>
            <article className={`${styles.card} ${styles.fadeIn}`}>
              <h3 className={styles.cardTitle}>Depth Control</h3>
              <p className={styles.cardText}>
                Pick Minimum, Medium, or Maximum coverage. Study the way you want.
              </p>
            </article>

            <article className={`${styles.card} ${styles.fadeIn}`}>
              <h3 className={styles.cardTitle}>Smart Explanations</h3>
              <p className={styles.cardText}>
                Our AI tutor breaks down every answer so you truly understand.
              </p>
            </article>

            <article className={`${styles.card} ${styles.fadeIn}`}>
              <h3 className={styles.cardTitle}>Modern Flashcards</h3>
              <p className={styles.cardText}>
                Interactive flipping with progress tracking—stay focused and sharp.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${styles.ctaBand} ${styles.fadeIn}`}>
        <div className={styles.container}>
          <div className={styles.ctaInner}>
            <div>
              <h3 className={styles.ctaTitle}>Ready to level up your study?</h3>
              <p className={styles.ctaText}>Start free. Upgrade when you’re ready.</p>
            </div>
            <Link href="/pricing" className={`${styles.btn} ${styles.btnPrimary}`}>
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${styles.footer} ${styles.fadeIn}`}>
        <div className={styles.container}>
          <span>© {new Date().getFullYear()} StudySmart</span>
          <div className={styles.footerLinks}>
            <Link href="/pricing">Pricing</Link>
            <a href="mailto:support@studysmart.example">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
