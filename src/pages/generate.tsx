import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import layout from "../styles/layout.module.css";

export default function Generate() {
  const [input, setInput] = useState("");

  return (
    <AppLayout>
      <section className={layout.card}>
        <h1>Generate Study Materials</h1>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste notes here..."
          style={{ width: "100%", minHeight: 200 }}
        />
      </section>
    </AppLayout>
  );
}
