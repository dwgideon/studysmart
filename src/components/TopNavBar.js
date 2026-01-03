// src/components/TopNavBar.js
import Link from 'next/link';
import styles from './TopNavBar.module.css';

export default function TopNavBar() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand / Logo on the left */}
        <Link href="/" className={styles.brand} aria-label="StudySmart Home">
          <img
            src="/studysmart-logo.png"
            alt="StudySmart logo"
            className={styles.logo}
          />
         
        </Link>

        {/* Nav on the right */}
        <nav className={styles.nav}>
          <Link href="/pricing" className={styles.link}>Pricing</Link>
          <div className={styles.actions}>
            <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
              Log in
            </Link>
            <Link href="/" className={`${styles.btn} ${styles.btnPrimary}`}>
              Create Account
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

