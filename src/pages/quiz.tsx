import { useState } from "react";
import Layout from "../components/Layout";
import { useStudyStore } from "../store/useStudyStore";
import { parseQuizText } from "../utils/parseQuiz";

export default function QuizPage() {
  const { files } = useStudyStore();
  const [selectedFile, setSelectedFile] = useState(files[0]?.name || "");

  const currentFile = files.find(f => f.name === selectedFile);
  const questions = currentFile ? parseQuizText(currentFile.extractedText) : [];

  return (
    <Layout>
      <h1>📝 Quiz</h1>
      <label>Choose a file:{" "}
        <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
          {files.map(f => (
            <option key={f.name} value={f.name}>{f.name}</option>
          ))}
        </select>
      </label>
      {questions.length > 0 ? questions.map((q, i) => (
        <div key={i} style={{ margin: "1rem 0", padding: "1rem", background: "#f2f2f2" }}>
          <strong>Q{i + 1}:</strong> <div dangerouslySetInnerHTML={{ __html: q }} />
        </div>
      )) : <p>No data available. Please upload and process a file first.</p>}
    </Layout>
  );
}

