import { useStudyStore } from "../store/useStudyStore";

export default function FileList() {
  const { files, deleteFile, renameFile, setActiveFile } = useStudyStore();

  const handleRename = (id) => {
    const newName = prompt("Enter new file name:");
    if (newName) renameFile(id, newName);
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Your Files</h2>
      {files.length === 0 ? (
        <p>No files yet. Upload or generate some content!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((file) => (
            <li
              key={file.id}
              style={{
                backgroundColor: file.active ? "#e3f2fd" : "#f9f9f9",
                padding: "1rem",
                marginBottom: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            >
              <strong>{file.name}</strong>
              <div style={{ marginTop: "0.5rem" }}>
                <button onClick={() => setActiveFile(file.id)}>📂 Select</button>{" "}
                <button onClick={() => handleRename(file.id)}>✏️ Rename</button>{" "}
                <button onClick={() => deleteFile(file.id)}>🗑️ Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

