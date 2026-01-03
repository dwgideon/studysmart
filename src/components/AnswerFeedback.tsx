type Props = {
  correct: boolean;
  seconds: number;
  correctAnswer: string;
};

export default function AnswerFeedback({
  correct,
  seconds,
  correctAnswer,
}: Props) {
  let title = "";
  let message = "";
  let color = "";

  if (!correct && seconds > 10) {
    title = "Needs Review ❌";
    message =
      "You took some time and missed this. Focus on the key idea and try again.";
    color = "bg-red-100 text-red-800";
  } else if (!correct) {
    title = "Almost There ⚠️";
    message =
      "You were close! Review the answer and keep going — you're nearly there.";
    color = "bg-yellow-100 text-yellow-800";
  } else if (correct && seconds > 10) {
    title = "Correct — But Slow 🐢";
    message =
      "Correct! Try answering a bit faster next time to lock it in.";
    color = "bg-blue-100 text-blue-800";
  } else {
    title = "Mastered 🔥";
    message =
      "Fast and correct — this card is becoming automatic. Great work!";
    color = "bg-green-100 text-green-800";
  }

  return (
    <div className={`mt-6 rounded-lg p-4 ${color}`}>
      <div className="font-semibold text-lg">{title}</div>
      <p className="mt-2">{message}</p>

      {!correct && (
        <div className="mt-3">
          <div className="font-medium">Correct Answer:</div>
          <div className="italic">{correctAnswer}</div>
        </div>
      )}
    </div>
  );
}
