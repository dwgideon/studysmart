import type { LibraryGrade, LibrarySubject } from "./studyLibrary.ts";

export const CURRICULUM_SCHEMA_VERSION = "1.0.0";

export type CurriculumStatus = "DRAFT" | "EDITOR_REVIEW" | "ACCESSIBILITY_REVIEW" | "SAFETY_REVIEW" | "PUBLISHED" | "RETIRED";
export type EditorialRole = "AUTHOR" | "EDUCATOR" | "ACCESSIBILITY" | "SAFETY" | "PUBLISHER";

export type CurriculumSource = {
  kind: "ORIGINAL" | "OPEN_LICENSE" | "DISTRICT_LICENSED";
  attribution: string;
  license: string;
  reviewedBy?: string;
};

export type ConceptReference = {
  id: string;
  name: string;
  description: string;
  prerequisiteIds?: string[];
};

export type StandardReference = {
  framework: string;
  code: string;
  statement: string;
};

export type WorkedExample = {
  prompt: string;
  steps: string[];
  answer: string;
  whyItWorks: string;
};

export type PracticeItem = {
  id: string;
  prompt: string;
  choices?: string[];
  answer: string;
  feedback: string;
  misconception?: string;
  hint?: string;
};

export type MisconceptionCheck = {
  id: string;
  misconception: string;
  prompt: string;
  expectedResponse: string;
  repair: string;
};

export type ExitTicket = {
  prompt: string;
  answer: string;
  successCriteria: string;
};

export type FlashcardContent = {
  id: string;
  front: string;
  back: string;
  conceptId: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  conceptId: string;
  difficulty: "RECALL" | "APPLY" | "TRANSFER";
};

export type AccessibilityAlternatives = {
  visualDescription: string;
  readAloud: string;
  simplifiedLanguage: string;
  interactionAlternative: string;
  supports: string[];
};

export type LessonPath = {
  when: string;
  steps: string[];
  nextLessonId?: string;
};

export type MasteryEvidenceRules = {
  threshold: number;
  minimumIndependentItems: number;
  requiredExitTicket: boolean;
  evidenceTypes: Array<"GUIDED" | "INDEPENDENT" | "MISCONCEPTION_REPAIR" | "EXIT_TICKET" | "QUIZ" | "FLASHCARD">;
  nextReviewDays: number[];
};

export type ReviewSchedule = {
  initialDays: number;
  intervalsDays: number[];
  retentionTarget: number;
};

export type CurriculumLesson = {
  id: string;
  unitId: string;
  version: number;
  schemaVersion: string;
  status: CurriculumStatus;
  sequence: number;
  title: string;
  grade: LibraryGrade;
  subject: LibrarySubject;
  learningObjective: string;
  prerequisiteConcepts: ConceptReference[];
  concepts: ConceptReference[];
  standards: StandardReference[];
  teacherExplanation: string;
  studentExplanation: string;
  workedExample: WorkedExample;
  guidedPractice: PracticeItem[];
  independentPractice: PracticeItem[];
  misconceptionChecks: MisconceptionCheck[];
  exitTicket: ExitTicket;
  flashcards: FlashcardContent[];
  quizQuestions: QuizQuestion[];
  readAloudScript: string[];
  accessibilityAlternatives: AccessibilityAlternatives;
  remediationPath: LessonPath;
  extensionPath: LessonPath;
  masteryEvidenceRules: MasteryEvidenceRules;
  reviewSchedule: ReviewSchedule;
  source: CurriculumSource;
  authoringNotes?: string;
};

export type CurriculumUnit = {
  id: string;
  version: number;
  status: CurriculumStatus;
  title: string;
  description: string;
  grade: LibraryGrade;
  subject: LibrarySubject;
  standards: StandardReference[];
  prerequisiteConcepts: ConceptReference[];
  lessons: CurriculumLesson[];
  source: CurriculumSource;
};

export function allLessons(units: CurriculumUnit[]) {
  return units.flatMap((unit) => unit.lessons);
}
