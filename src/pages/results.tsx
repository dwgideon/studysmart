// src/pages/results.js
import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from './Results.module.css';
import { MaterialsContext } from '../context/MaterialsContext';

export default function Results() {
  const router = useRouter();
  const { materials } = useContext(MaterialsContext);
  const [tab, setTab] = useState('flashcards');

  // Flashcard state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const quizQuestions = materials?.quizQuestions || [];
  const [userAnswers, setUserAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  // redirect if no data
  useEffect(() => {
    if (!materials) router.replace('/');
  }, [materials, router]);

  // init quiz answers when materials load
  useEffect(() => {
    setUserAnswers(Array(quizQuestions.length).fill(null));
  }, [quizQuestions.length]);

  if (!materials) return null;

  const flashcards = materials.flashcards || [];
  const totalFlash = flashcards.length;

  // Flashcard flip
  const handleFlip = () => {
    if (isFlipped) return;
    setIsFlipped(true);
    setTimeout(() => {
      setIsFlipped(false);
      setCurrentIndex((i) => (i + 1 < totalFlash ? i + 1 : 0));
    }, 1000);
  };

  // Quiz answer select
  const handleSelect = (idx, choice) => {
    if (finished) return;
    const copy = [...userAnswers];
    copy[idx] = choice;
    setUserAnswers(copy);
  };

  const handleFinish = () => {
    let count = 0;
    quizQuestions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) count++;
    });
    setScore(count);
    setFinished(true);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>StudySmart Results</title>
      </Head>

      <h1 className={styles.title}>Your AI-Generated Study Materials</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['flashcards', 'quiz', 'summary', 'guide'].map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
            onClick={() => {
              setTab(t);
              // reset flashcards state
              if (t === 'flashcards') {
                setCurrentIndex(0);
                setIsFlipped(false);
              }
            }}
          >
            {t === 'flashcards'
              ? 'Flashcards'
              : t === 'quiz'
              ? 'Quiz Questions'
              : t === 'summary'
              ? 'Summary'
              : 'Study Guide'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Flashcards */}
        {tab === 'flashcards' && totalFlash > 0 && (
          <div className={styles.flashcardWrapper}>
            <div className={styles.flashcard} onClick={handleFlip}>
              <div
                className={`${styles.cardInner} ${
                  isFlipped ? styles.isFlipped : ''
                }`}
              >
                <div className={styles.cardFront}>
                  {flashcards[currentIndex].question}
                </div>
                <div className={styles.cardBack}>
                  {flashcards[currentIndex].answer}
                </div>
              </div>
            </div>
            <div className={styles.counter}>
              Card {currentIndex + 1} of {totalFlash}
            </div>
          </div>
        )}

        {/* Quiz Questions */}
{tab === 'quiz' && (
  <div className={styles.quiz}>
    {quizQuestions.map((q, i) => {
      const isCorrect = userAnswers[i] === q.answer;
      return (
        <div key={i} className={styles.quizItem}>
          <p className={styles.quizQ}>{q.question}</p>
          <ul className={styles.choices}>
            {q.choices.map((c, j) => {
              const wrongPick = finished && userAnswers[i] === c && c !== q.answer;
              return (
                <li key={j}>
                  <label
                    className={`${wrongPick ? styles.incorrect : ''} ${
                      finished && c === q.answer ? styles.correct : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`quiz-${i}`}
                      value={c}
                      checked={userAnswers[i] === c}
                      disabled={finished}
                      onChange={() => handleSelect(i, c)}
                    />{' '}
                    {c}
                  </label>
                </li>
              );
            })}
          </ul>

          {/* Show explanation after finishing */}
          {finished && (
            <div className={styles.explanation}>
              <strong>Why?</strong> {q.explanation}
            </div>
          )}
        </div>
      );
    })}

    {!finished ? (
      <button
        className={styles.finishButton}
        onClick={handleFinish}
        disabled={userAnswers.includes(null)}
      >
        Finish Quiz
      </button>
    ) : (
      <div className={styles.score}>
        You scored {score} out of {quizQuestions.length}
      </div>
    )}
  </div>
)}


        {/* Summary */}
        {tab === 'summary' && (
          <div className={styles.summary}>
            {materials.summary
              .split('\n')
              .filter((p) => p.trim())
              .map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
          </div>
        )}

        {/* Study Guide */}
        {tab === 'guide' && (
          <ul className={styles.guide}>
            {materials.studyGuide.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}

