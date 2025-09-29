import { useState } from "react";
import Layout from "../components/Layout";
import { useStudyStore } from "../store/useStudyStore";

export default function Practice() {
  const { files } = useStudyStore();
  const [selectedFile, setSelectedFile] = useState(files.length > 0 ? files[0].name : "");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const selected = files.find((f) => f.name === selectedFile);
  const flashcards = selected?.flashcardsWithOptions || [];

  const currentCard = flashcards[currentIndex];
  const choices = [...(currentCard?.wrongAnswers || []), currentCard?.answer].sort(() => 0.5 - Math.random());

  const handleAnswer = (choice) => {
    if (choice === currentCard.answer) setScore(score + 1);
    if (currentIndex + 1 === flashcards.length) setShowResults(true);
    else setCurrentIndex(currentIndex + 1);
  };

  const resetTest = () => {
    setCurrentIndex(0);
    setScore(0);
    setShowResults(false);
  };

  return (
    <Layout>
      <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>📝 Practice Test</h1>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "10px" }}>Choose a file:</label>
          <select
            value={selectedFile}
            onChange={(e) => {
              setSelectedFile(e.target.value);
              resetTest();
            }}
            style={{ padding: "10px", borderRadius: "6px" }}
          >
            {files.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {flashcards.length === 0 ? (
          <p>No data available. Please upload and process a file first.</p>
        ) : showResults ? (
          <div style={{ marginTop: "3rem" }}>
            <h2>🎉 You scored {score} out of {flashcards.length}</h2>
            <button onClick={resetTest} style={buttonStyle}>🔁 Retry</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
              {currentCard.question}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {choices.map((choice, i) => (
                <button key={i} onClick={() => handleAnswer(choice)} style={choiceStyle}>
                  {choice}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "2rem", color: "#666" }}>
              Question {currentIndex + 1} of {flashcards.length}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const buttonStyle = {
  backgroundColor: "#edf2f7",
  border: "1px solid #cbd5e0",
  borderRadius: "8px",
  padding: "12px 28px",
  fontWeight: "bold",
  fontSize: "1rem",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const choiceStyle = {
  backgroundColor: "#fff",
  border: "2px solid #4a90e2",
  borderRadius: "8px",
  padding: "12px 20px",
  fontSize: "1rem",
  cursor: "pointer",
  transition: "background 0.2s",
};

