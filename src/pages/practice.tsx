import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../../styles/layout.module.css";

export default function PracticePage() {
  const [i, setI] = useState(0);

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Practice</h1>
        <button onClick={() => setI((n) => n + 1)}>Next</button>
      </section>
    </AppLayout>
  );
}
