import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../../styles/layout.module.css";

export default function InteractiveQuiz() {
  const [score] = useState(0);

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Interactive Quiz</h1>
        <p>Score: {score}</p>
      </section>
    </AppLayout>
  );
}
