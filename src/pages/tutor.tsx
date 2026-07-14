import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import RequireAuth from "../components/RequireAuth";
import styles from "@/styles/UI.module.css";
import { useK12Experience } from "@/components/K12Experience";

type Attribution = {
  mode: "UPLOADED_MATERIAL" | "GENERAL_KNOWLEDGE";
  label: string;
  citations: Array<{
    label: string;
    sourceChunkId: string;
    sourceMaterialId: string;
    title: string;
    locator: Record<string, unknown>;
    excerpt: string;
  }>;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  attribution?: Attribution;
};

type QuizQuestion = {
  conceptId?: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
};

export default function TutorPage() {
  return (
    <RequireAuth>
      <TutorChat />
    </RequireAuth>
  );
}

function TutorChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { gradeLevel, labels } = useK12Experience();
  const [sourceMode, setSourceMode] = useState("materials");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) {return;}

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setShowQuiz(false);
    setQuizSubmitted(false);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          sourceMode,
          conversationId,
        }),
      });

      const data = await res.json();
      if (res.status === 423 && data.code === "LEARNING_LOCKED") {
        await router.push("/safety-lock");
        setLoading(false);
        return;
      }
      if (typeof data.conversationId === "string") {
        setConversationId(data.conversationId);
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply ?? "No response.",
          attribution: data.attribution,
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Tutor service unavailable." },
      ]);
    }

    setLoading(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const generateQuiz = async () => {
    const lastLesson = messages
      .filter((m) => m.role === "assistant")
      .slice(-1)[0]?.content;

    if (!lastLesson) {return;}

    setLoading(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson: lastLesson }),
      });

      const data = await res.json();
      setQuiz(data.questions ?? []);
      setShowQuiz(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } catch {
      alert("Failed to generate quiz");
    }
    setLoading(false);
  };

  const submitQuiz = async () => {
    const sourceMaterialId = messages
      .filter((message) => message.role === "assistant")
      .at(-1)?.attribution?.citations[0]?.sourceMaterialId;
    setQuizSubmitted(true);
    await fetch("/api/saveQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Tutor lesson quiz",
        source: "tutor",
        questions: quiz,
        answers: quizAnswers,
        conversationId,
        sourceMaterialId,
      }),
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.chatWindow}>
        <h2 className={styles.title}>StudySmart {labels.tutor}</h2>

        <div className={styles.tutorControls}>
          <div className={styles.gradeContext}>
            <span>Automatically adapted</span>
            <strong>{gradeLevel ? `Grade ${gradeLevel}` : "K–12 learning level"}</strong>
          </div>
          <label>
            Answer using
            <select
              value={sourceMode}
              onChange={(e) => setSourceMode(e.target.value)}
            >
              <option value="materials">My study materials</option>
              <option value="general">General knowledge</option>
            </select>
          </label>
        </div>

        <div className={styles.messages} role="log" aria-live="polite" aria-label="Tutor conversation">
          {messages.length === 0 && (
            <p className={styles.empty}>
              Ask anything — homework help, concept explanations, or test prep.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? styles.user : styles.assistant}
            >
              {m.role === "assistant" ? (
                <>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                  {m.attribution && (
                    <div className={styles.attribution}>
                      <span>{m.attribution.label}</span>
                      {m.attribution.citations.map((citation) => (
                        <details key={citation.sourceChunkId}>
                          <summary>[{citation.label}] {citation.title} · {formatLocator(citation.locator)}</summary>
                          <small>{citation.excerpt}</small>
                        </details>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                m.content
              )}
            </div>
          ))}
          {loading && <div className={styles.assistant}>Thinking…</div>}
        </div>

        {messages.some((m) => m.role === "assistant") && (
          <button
            type="button"
            className={styles.quizButton}
            onClick={generateQuiz}
            disabled={loading}
          >
            Turn this lesson into a quiz
          </button>
        )}

        {showQuiz && quiz.length > 0 && (
          <div className={styles.quizPanel}>
            <h3>Quiz time</h3>
            {quiz.map((q, i) => (
              <div key={i} className={styles.quizQuestion}>
                <strong>
                  {i + 1}. {q.question}
                </strong>
                {(["A", "B", "C", "D"] as const).map((key) => {
                  const value = q.options[key];
                  if (!value) {return null;}
                  return (
                    <label key={key} style={{ display: "block", marginTop: 6 }}>
                      <input
                        type="radio"
                        name={`q${i}`}
                        disabled={quizSubmitted}
                        checked={quizAnswers[i] === key}
                        onChange={() =>
                          setQuizAnswers((a) => ({ ...a, [i]: key }))
                        }
                      />
                      <strong> {key}.</strong> {value}
                    </label>
                  );
                })}
                {quizSubmitted && (
                  <p className={styles.quizFeedback}>
                    {quizAnswers[i] === q.answer ? "Correct" : "Incorrect"} —{" "}
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
            {!quizSubmitted ? (
              <button type="button" onClick={submitQuiz}>
                Submit answers
              </button>
            ) : (
              <p style={{ fontWeight: 600 }}>
                Score:{" "}
                {quiz.filter((q, i) => quizAnswers[i] === q.answer).length} /{" "}
                {quiz.length}
              </p>
            )}
          </div>
        )}

        <div className={styles.inputBar}>
          <label className={styles.srOnly} htmlFor="tutor-question">Ask your tutor</label>
          <input
            id="tutor-question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask your tutor..."
            autoComplete="off"
          />
          <button type="button" onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function formatLocator(locator: Record<string, unknown>) {
  if (typeof locator.page === "number") {return `page ${locator.page}`;}
  if (typeof locator.startSeconds === "number") {
    const minutes = Math.floor(locator.startSeconds / 60);
    const seconds = Math.floor(locator.startSeconds % 60).toString().padStart(2, "0");
    return `transcript ${minutes}:${seconds}`;
  }
  if (typeof locator.section === "string" && locator.section) {return locator.section;}
  return "source excerpt";
}
