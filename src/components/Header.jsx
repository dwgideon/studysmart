import styles from './Header.module.css';
import Link from 'next/link';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logoSection}>
        <Link href="/">
          <img src="/studysmart-logo.png" alt="StudySmart Logo" className={styles.logo} />
        </Link>
      </div>
      <nav className={styles.nav}>
        <Link href="/pricing">Pricing</Link>
        <Link href="/login" className={styles.loginBtn}>Log in</Link>
        <Link href="/app" className={styles.openAppBtn}>Open App</Link>
      </nav>
    </header>
  );
}
