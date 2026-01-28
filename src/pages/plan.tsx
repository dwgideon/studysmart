import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../../styles/layout.module.css";

export default function StudyPlanPage() {
  const [goal, setGoal] = useState("");

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Study Plan</h1>

        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Study goal..."
        />
      </section>
    </AppLayout>
  );
}
