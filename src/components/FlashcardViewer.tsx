// components/FlashcardViewer.tsx
import React, { useState } from "react";
import clsx from "clsx";

interface Flashcard {
  front: string;
  back: string;
}

interface Props {
  flashcards: Flashcard[];
}

export const FlashcardViewer: React.FC<Props> = ({ flashcards }) => {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards.length) {
    return <div className="text-center text-gray-500">No flashcards available</div>;
  }

  const next = () => {
    setCurrent((prev) => (prev + 1) % flashcards.length);
    setFlipped(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setFlipped(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <div className="relative h-64 perspective">
        <div
          className={clsx(
            "w-full h-full absolute transition-transform duration-500 transform-style-preserve-3d",
            flipped ? "rotate-y-180" : ""
          )}
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Front */}
          <div className="absolute w-full h-full bg-white border border-gray-300 rounded-lg shadow-md backface-hidden flex items-center justify-center p-6 text-xl text-center">
            {flashcards[current].front}
          </div>

          {/* Back */}
          <div className="absolute w-full h-full bg-blue-50 border border-blue-200 rounded-lg shadow-md backface-hidden rotate-y-180 flex items-center justify-center p-6 text-lg text-center">
            {flashcards[current].back}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={prev}
        >
          ◀ Previous
        </button>
        <span className="text-sm text-gray-600">
          Card {current + 1} of {flashcards.length}
        </span>
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={next}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};
