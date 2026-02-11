import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";

export default function QuizzesPage() {
  const [q] = useState(0);

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Quizzes</h1>
        <p>Question {q + 1}</p>
      </section>
    </AppLayout>
  );
}
