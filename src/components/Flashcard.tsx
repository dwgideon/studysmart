type FlashcardProps = {
  text: string;
  onFlip?: () => void;
};

export function Flashcard({ text, onFlip }: FlashcardProps) {
  return (
    <div
      onClick={onFlip}
      style={{
        border: "1px solid #ccc",
        padding: 24,
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      <p style={{ fontSize: 18 }}>{text}</p>
      <small>(Click to flip)</small>
    </div>
  );
}
