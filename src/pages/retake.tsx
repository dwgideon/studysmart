import { useEffect } from "react";

export default function RetakePage() {

  useEffect(() => {
    if (typeof window === "undefined") return;

    const data = {
      startedAt: new Date().toISOString(),
    };

    localStorage.setItem("retakeQuiz", JSON.stringify(data));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Retry Quiz</h1>
      <p>Preparing retry session...</p>
    </div>
  );
}
