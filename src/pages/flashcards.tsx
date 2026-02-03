import { useEffect, useState } from 'react';

export default function FlashcardsPage() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(10);
  const messages = [
    'Preparing your flashcards…',
    'Analyzing your notes…',
    'Generating questions…',
    'Almost ready…',
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const p = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 6 : prev));
    }, 400);

    const m = setInterval(() => {
      setI(x => (x + 1) % messages.length);
    }, 1800);

    // simulate backend work — replace with real logic
    const done = setTimeout(() => {
      setProgress(100);
      setLoading(false);
    }, 5000);

    return () => {
      clearInterval(p);
      clearInterval(m);
      clearTimeout(done);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '4rem', color: 'white' }}>
        <h2>{messages[i]}</h2>

        <div
          style={{
            marginTop: 16,
            height: 8,
            maxWidth: 400,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg,#4f8cff,#7aa8ff)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          This usually takes less than a minute
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '4rem', color: 'white' }}>
      <h1>Your Flashcards</h1>
      {/* real flashcard UI goes here */}
    </div>
  );
}
