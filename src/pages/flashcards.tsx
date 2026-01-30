import { useEffect, useState } from 'react';
import styles from './Flashcards.module.css';

export default function FlashcardsPage() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(5);
  const [statusText, setStatusText] = useState('Preparing your session…');

  const messages = [
    'Preparing your session…',
    'Analyzing your content…',
    'Generating flashcards…',
    'Organizing results…'
  ];

  // Fake-but-smooth progress bar
  useEffect(() => {
    if (!loading) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 8 : prev));
    }, 500);

    return () => clearInterval(progressInterval);
  }, [loading]);

  // Rotate status messages
  useEffect(() => {
    let index = 0;
    const messageInterval = setInterval(() => {
      index++;
      if (index < messages.length) {
        setStatusText(messages[index]);
      }
    }, 2000);

    return () => clearInterval(messageInterval);
  }, []);

  // Simulate backend completion (REMOVE when wiring real data)
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
      setLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <p className={styles.status}>{statusText}</p>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className={styles.subtle}>This usually takes less than a minute</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Your Flashcards</h1>
      {/* real flashcard UI goes here */}
    </div>
  );
}
