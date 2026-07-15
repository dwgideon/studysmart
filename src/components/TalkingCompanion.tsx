import { useEffect, useMemo } from "react";
import type { Companion } from "@/lib/learningCompanions";
import { useReadAloud } from "@/hooks/useReadAloud";
import styles from "./TalkingCompanion.module.css";

type Props = {
  companion: Companion;
  text: string;
  speechRate: number;
  autoRead?: boolean;
  autoKey?: string;
  compact?: boolean;
};

export default function TalkingCompanion({ companion, text, speechRate, autoRead = false, autoKey = "", compact = false }: Props) {
  const speech = useReadAloud(speechRate);
  useEffect(() => {
    if (autoRead) {speech.speak(text);}
    return speech.stop;
  // The key deliberately controls when a new caption is spoken.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoKey, autoRead]);

  const segments = useMemo(() => {
    let cursor = 0;
    return text.split(/(\s+)/).map((segment) => {
      const start = cursor;
      cursor += segment.length;
      return { segment, start, end: cursor };
    });
  }, [text]);

  return (
    <section className={`${styles.companion} ${compact ? styles.compact : ""}`} style={{ "--mascot-color": companion.color, "--mascot-accent": companion.accent } as React.CSSProperties} aria-label={`${companion.name} the ${companion.animal}, talking learning companion`}>
      <div className={`${styles.mascot} ${speech.speaking && !speech.paused ? styles.talking : ""}`} aria-hidden="true">
        <span>{companion.emoji}</span><i/><i/><i/>
      </div>
      <div className={styles.bubble}>
        <strong>{companion.name} says:</strong>
        <p aria-live="polite">{segments.map(({ segment, start, end }, index) => <span key={`${start}-${index}`} className={speech.speaking && speech.activeCharacter >= start && speech.activeCharacter < end && segment.trim() ? styles.activeWord : ""}>{segment}</span>)}</p>
        <div className={styles.controls}>
          <button type="button" onClick={() => speech.speak(text)} aria-label={`Hear ${companion.name} read this aloud`}>🔊 <span>{speech.speaking ? "Start again" : "Read to me"}</span></button>
          {speech.speaking && <button type="button" onClick={speech.togglePause} aria-label={speech.paused ? "Continue reading" : "Pause reading"}>{speech.paused ? "▶" : "⏸"} <span>{speech.paused ? "Keep going" : "Pause"}</span></button>}
          {speech.speaking && <button type="button" onClick={speech.stop} aria-label="Stop reading">■ <span>Stop</span></button>}
          {!speech.supported && <small>Your browser does not offer spoken reading. The words will always stay on screen.</small>}
        </div>
      </div>
    </section>
  );
}
