import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logoWrap}>
          <Image
            src="/studysmart-logo.png"
            alt="StudySmart"
            width={160}
            height={40}
            priority
            className={styles.logo}
          />
        </Link>

        {/* Navigation */}
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/pricing" className={styles.navLink}>
            Pricing
          </Link>

          <Link href="/login" className={styles.navLink}>
            Log in
          </Link>

          <Link href="/dashboard" className={styles.primaryBtn}>
            Open App
          </Link>
        </nav>
      </div>
    </header>
  );
}
