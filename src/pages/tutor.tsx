import { useState } from "react";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/UI.module.css";

export default function TutorPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState("middle");

  const [quiz, setQuiz] = useState<any[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const nextMessages = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          grade
        }),
      });

      const data = await res.json();

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply }
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "❌ Tutor service unavailable."
        }
      ]);
    }

    setLoading(false);
  };

  const generateQuiz = async () => {
    if (messages.length === 0) return;

    const lastLesson = messages
      .filter(m => m.role === "assistant")
      .slice(-1)[0]?.content;

    if (!lastLesson) return;

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: lastLesson,
          grade
        }),
      });

      const data = await res.json();
      setQuiz(data.questions);
      setShowQuiz(true);

    } catch {
      alert("Failed to generate quiz");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.chatWindow}>
        <h2 className={styles.title}>StudySmart Tutor</h2>

        {/* Grade Level Selector */}
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          style={{
            marginBottom: "0.75rem",
            padding: "0.4rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          <option value="elementary">Elementary (Grades 3–5)</option>
          <option value="middle">Middle School (Grades 6–8)</option>
          <option value="high">High School (Grades 9–12)</option>
        </select>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? styles.user : styles.assistant}
            >
              {m.role === "assistant" ? (
                <ReactMarkdown>{m.content}</ReactMarkdown>
              ) : (
                m.content
              )}
            </div>
          ))}

          {loading && (
            <div className={styles.assistant}>Thinking…</div>
          )}
        </div>

        {/* QUIZ BUTTON */}
        <button
          style={{
            margin: "10px 0",
            background: "#6f4cff",
            color: "white",
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            width: "100%",
            cursor: "pointer"
          }}
          onClick={generateQuiz}
          disabled={loading}
        >
          📝 Turn This Lesson Into a Quiz
        </button>

        {/* QUIZ UI */}
        {showQuiz && quiz.length > 0 && (
          <div style={{
            background: "#f8f9ff",
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1rem"
          }}>
            <h3>🎯 Quiz Time</h3>

            {quiz.map((q, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "white",
                  borderRadius: "10px"
                }}
              >
                <strong>{i + 1}. {q.question}</strong>

                {Object.entries(q.options as Record<string, string>).map(
  ([key, value]: [string, string]) => (
                  <div key={key}>
                    <label>
                      <input type="radio" name={`q${i}`} />
                      <strong> {key}.</strong> {value}
                    </label>
                  </div>
                ))}

                <div style={{
                  marginTop: "0.5rem",
                  fontSize: "0.85rem",
                  color: "#666"
                }}>
                  ✅ Answer: {q.answer} — {q.explanation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INPUT BAR */}
        <div className={styles.inputBar}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor..."
          />
          <button onClick={sendMessage}>
            Send
          </button>
        </div>

      </div>
    </main>
  );
}
