import { useEffect, useState } from "react";
import styles from "./TestModeBanner.module.css";

export default function TestModeBanner() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    fetch("/api/system/mode", { cache: "no-store" })
      .then((response) => response.json())
      .then((mode) => setEnabled(mode.aiFreeTestMode === true))
      .catch(() => setEnabled(false));
  }, []);
  if (!enabled) {return null;}
  return <div className={styles.banner} role="status"><span>FREE TEST</span><strong>AI-free test mode is on</strong><small>No OpenAI calls or AI usage charges. Results are deterministic test content.</small></div>;
}
