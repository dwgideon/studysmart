// Reusable domain models for StudySmart

export type Depth = 'minimum' | 'medium' | 'maximum';

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export type QuizChoice = {
  label: string;   // e.g., "A", "B", "C", "D"
  text: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  correctLabel: string; // "A" | "B" | "C" | "D"
  explanation?: string;
};

export type StudyGuideSection = {
  heading: string;
  bullets: string[];
};

export type StudyMaterials = {
  topic: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  summary: string[];
  guide: StudyGuideSection[];
};

