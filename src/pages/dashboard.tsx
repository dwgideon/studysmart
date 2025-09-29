"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/Dashboard.module.css";
import Link from "next/link";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  userId: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  userId: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  options: string[];
}

export interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  userId: string;
  questions: QuizQuestion[];
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      try {
        const [notesRes, flashcardsRes, quizzesRes] = await Promise.all([
          fetch(`/api/getNotes?userId=${user.id}`),
          fetch(`/api/getFlashcards?userId=${user.id}`),
          fetch(`/api/getQuizzes?userId=${user.id}`),
        ]);

        if (notesRes.ok) setNotes(await notesRes.json());
        if (flashcardsRes.ok) setFlashcards(await flashcardsRes.json());

        if (quizzesRes.ok) {
          const quizData: Quiz[] = await quizzesRes.json();
          const parsed = quizData.map((q) => ({
            ...q,
            questions: q.questions.map((qq) => ({
              ...qq,
              options:
                typeof qq.options === "string"
                  ? JSON.parse(qq.options)
                  : qq.options,
            })),
          }));
          setQuizzes(parsed);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <p className={styles.empty}>Loading...</p>;

  if (!userId) {
    return (
      <main className={styles.page}>
        <h1>Dashboard</h1>
        <p>
          Please <a href="/login">log in</a> to access your saved study
          progress.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1>Your Dashboard</h1>
  {/* Quick Actions */}
  <div className={styles.quickActions}>
    <Link href="/" className={styles.quickButton}>
      📂 Upload New File
    </Link>
    <Link href="/quiz" className={styles.quickButton}>
      📝 Start New Quiz
    </Link>
    <Link href="/flashcards" className={styles.quickButton}>
      🎴 Practice Flashcards
    </Link>
    <Link href="/games" className={styles.quickButton}>
      🎮 Play Study Games
    </Link>
  </div>

      {/* Notes */}
      <section className={styles.section}>
        <h2>Notes</h2>
        {notes.length === 0 ? (
          <p className={styles.empty}>No saved notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={styles.card}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
              <small>
                Saved on {new Date(note.createdAt).toLocaleDateString()}
              </small>
            </div>
          ))
        )}
      </section>

      {/* Flashcards */}
      <section className={styles.section}>
        <h2>Flashcards</h2>
        {flashcards.length === 0 ? (
          <p className={styles.empty}>No saved flashcards yet.</p>
        ) : (
          flashcards.map((fc) => (
            <div key={fc.id} className={styles.card}>
              <p>
                <strong>Q:</strong> {fc.question}
              </p>
              <p>
                <strong>A:</strong> {fc.answer}
              </p>
            </div>
          ))
        )}
      </section>

      {/* Quizzes */}
      <section className={styles.section}>
        <h2>Quizzes</h2>
        {quizzes.length === 0 ? (
          <p className={styles.empty}>No saved quizzes yet.</p>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className={styles.card}>
              <h3>{quiz.title}</h3>
              {quiz.questions.map((q) => (
                <div key={q.id} style={{ marginBottom: "0.75rem" }}>
                  <p>
                    <strong>{q.question}</strong>
                  </p>
                  <ul className={styles.quizOptions}>
                    {q.options.map((opt, idx) => (
                      <li key={idx}>{opt}</li>
                    ))}
                  </ul>
                  <em>Answer: {q.answer}</em>
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
