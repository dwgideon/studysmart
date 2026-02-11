import React from "react";
import { TourProvider, useTour } from "@reactour/tour";

const steps = [
  {
    selector: ".recent-activity",
    content: "This shows your most recent study session.",
  },
  {
    selector: ".study-progress",
    content: "Here’s your weekly study progress tracker.",
  },
  {
    selector: ".quick-actions",
    content: "Use these buttons to quickly access flashcards, quizzes, and guides.",
  },
  {
    selector: ".upload-section",
    content: "Upload your notes or enter a topic here to generate study material.",
  },
];

export function TutorialWrapper({ children }: { children: React.ReactNode }) {
  return <TourProvider steps={steps}>{children}</TourProvider>;
}

export function TutorialStarter({ onFinish }: { onFinish: () => void }) {
  const { setIsOpen, setCurrentStep } = useTour();

  const startTutorial = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  // Reactour provides an `onClose` hook via TourProvider, but we’ll manually
  // handle finishing here by closing when tutorial ends
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onFinish();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onFinish]);

  return (
    <button
      onClick={startTutorial}
      style={{
        margin: "1rem 0",
        padding: "10px 16px",
        borderRadius: "8px",
        background: "#4361ee",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      Start Tutorial
    </button>
  );
}
