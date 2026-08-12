import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import styles from "./Header.module.css";
import { useK12Experience } from "./K12Experience";

export default function Header() {
  const user = useUser();
  const router = useRouter();
  const { labels } = useK12Experience();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const links = [
    ["/upload", "Add material"],
    ["/library", "Library"],
    ["/studio", "Study Studio"],
    ["/study", labels.study],
    ["/tutor", labels.tutor],
    ["/dashboard", labels.dashboard],
  ];
  const secondary = user
    ? [["/community", "Community"], ["/trust", "Trust"], ["/profile", "Profile"]]
    : [["/pricing", "Plans"], ["/login", "Log in"]];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          <span className={styles.logoWrap}>
            <Image src="/studysmart-logo.png" alt="" width={38} height={38} priority className={styles.logo} />
          </span>
          <span className={styles.brandText}><strong>StudySmart</strong><small>LEARNING OS</small></span>
        </Link>

        <button className={styles.menuButton} type="button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
          <span /><span /><span /><b className={styles.srOnly}>Menu</b>
        </button>

        <nav id="main-nav" className={`${styles.nav} ${open ? styles.open : ""}`} aria-label="Main navigation">
          <div className={styles.coreLinks}>
            {links.map(([href, label]) => (
              <Link key={href} href={href} aria-current={router.pathname === href ? "page" : undefined} className={styles.navLink} onClick={() => setOpen(false)}>{label}</Link>
            ))}
          </div>
          <div className={styles.divider} />
          <div className={styles.secondaryLinks}>
            {secondary.map(([href, label]) => (
              <Link key={href} href={href} aria-current={router.pathname === href ? "page" : undefined} className={styles.iconLink} onClick={() => setOpen(false)}>{label}</Link>
            ))}
            {user && <button type="button" className={styles.iconLink} onClick={signOut}>Sign out</button>}
          </div>
          <Link href="/dashboard" className={styles.primaryBtn} onClick={() => setOpen(false)}><span className={styles.statusDot} /> Open workspace</Link>
        </nav>
      </div>
    </header>
  );
}
