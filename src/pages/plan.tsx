import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";
import { useStudyStore } from "../store/useStudyStore";

export default function StudyPlanPage() {
  const store = useStudyStore();

  const sessions =
    (store as any).sessions ||
    (store as any).studySessions ||
    [];

  const [goal, setGoal] = useState("");

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Study Plan</h1>

        <p style={{ marginBottom: "1rem" }}>
          Create a simple study goal and track your recent sessions.
        </p>

        <div style={{ marginBottom: "1.5rem" }}>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Review science for 20 minutes"
            style={{
              width: "100%",
              padding: "0.6rem",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#0f1220",
              color: "#fff",
            }}
          />
        </div>

        <h3 style={{ marginBottom: "0.75rem" }}>Recent Sessions</h3>

        {sessions.length === 0 ? (
          <p>No recent sessions yet.</p>
        ) : (
          <ul>
            {sessions.map((s: any, i: number) => (
              <li key={i} style={{ marginBottom: "0.5rem" }}>
                {s.topic || "Study Session"} —{" "}
                {s.score !== undefined
                  ? `${s.score}/${s.total}`
                  : "completed"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
