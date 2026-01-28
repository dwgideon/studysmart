import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../../styles/layout.module.css";

export default function PracticePage() {
  const [, setI] = useState(0); // we only need the setter

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Practice</h1>

        <p>Flashcard practice mode coming next.</p>

        <button
          onClick={() => setI((n) => n + 1)}
          style={{
            marginTop: "1rem",
            padding: "0.6rem 1.2rem",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #5b8cff, #7c5cff)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Next
        </button>
      </section>
    </AppLayout>
  );
}
