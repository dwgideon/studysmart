export const GRADE_LEVELS = [
  { value: "K", label: "Kindergarten" },
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
] as const;

export const GRADE_LEVEL_VALUES = new Set<string>(
  GRADE_LEVELS.map((grade) => grade.value)
);

export type LearningContextPayload = {
  gradeLevel: string;
  ageGroup: string;
  primaryLearningGoal: string;
  courseId?: string;
  courseName: string;
  subject: string;
  examDate: string;
  courseLearningGoal: string;
};

export type AgeGroup = "UNDER_13" | "TEEN" | "ADULT";

const AGE_PROTECTION_ORDER: Record<AgeGroup, number> = {
  UNDER_13: 0,
  TEEN: 1,
  ADULT: 2,
};

/**
 * Learners cannot use an age selector to escape a more protective experience.
 * Grade level is treated as a safety signal, and an existing child setting can
 * only be relaxed through the reviewed correction workflow.
 */
export function protectedAgeGroupForGrade(input: {
  gradeLevel: string;
  requestedAgeGroup: AgeGroup;
  existingAgeGroup?: string | null;
  accountRole?: string;
}): AgeGroup {
  if (input.accountRole && input.accountRole !== "STUDENT") {
    return input.requestedAgeGroup;
  }

  const gradeNumber = input.gradeLevel === "K" ? 0 : Number(input.gradeLevel);
  let protectedGroup = input.requestedAgeGroup;
  if (Number.isFinite(gradeNumber) && gradeNumber <= 5) {
    protectedGroup = "UNDER_13";
  } else if (protectedGroup === "ADULT") {
    protectedGroup = "TEEN";
  }

  const existing = input.existingAgeGroup as AgeGroup | undefined;
  if (
    existing &&
    AGE_PROTECTION_ORDER[existing] !== undefined &&
    AGE_PROTECTION_ORDER[protectedGroup] > AGE_PROTECTION_ORDER[existing]
  ) {
    return existing;
  }
  return protectedGroup;
}

export function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export type GradeBand = "EARLY" | "ELEMENTARY" | "MIDDLE" | "HIGH";

export function gradeBandFor(gradeLevel: string): GradeBand {
  if (["K", "1", "2"].includes(gradeLevel)) {return "EARLY";}
  const grade = Number(gradeLevel);
  if (grade <= 5) {return "ELEMENTARY";}
  if (grade <= 8) {return "MIDDLE";}
  return "HIGH";
}

export type K12ExperienceConfig = {
  band: GradeBand;
  displayLabel: string;
  tutorWordLimit: number;
  readAloud: "REQUIRED" | "PREFERRED" | "OPTIONAL";
  visualSupport: "PRIMARY" | "HELPFUL" | "SECONDARY";
  responseModes: readonly string[];
  labels: { dashboard: string; tutor: string; study: string };
};

/** Shared age-appropriate product contract for web, mobile, tutor, and games. */
export function experienceForGrade(gradeLevel: string): K12ExperienceConfig {
  const band = gradeBandFor(gradeLevel);
  if (band === "EARLY") {
    return {
      band,
      displayLabel: "K–2 early learner",
      tutorWordLimit: 100,
      readAloud: "REQUIRED",
      visualSupport: "PRIMARY",
      responseModes: ["picture-choice", "oral-response", "tap-and-sort"],
      labels: { dashboard: "My learning adventure", tutor: "Learning helper", study: "Practice" },
    };
  }
  if (band === "ELEMENTARY") {
    return {
      band,
      displayLabel: "Grades 3–5 elementary learner",
      tutorWordLimit: 150,
      readAloud: "PREFERRED",
      visualSupport: "HELPFUL",
      responseModes: ["multiple-choice", "short-answer", "match-and-sort"],
      labels: { dashboard: "My learning path", tutor: "Learning coach", study: "Practice" },
    };
  }
  if (band === "MIDDLE") {
    return {
      band,
      displayLabel: "Grades 6–8 middle school learner",
      tutorWordLimit: 200,
      readAloud: "OPTIONAL",
      visualSupport: "SECONDARY",
      responseModes: ["multiple-choice", "constructed-response", "evidence-check"],
      labels: { dashboard: "Dashboard", tutor: "Tutor", study: "Study" },
    };
  }
  return {
    band,
    displayLabel: "High school learner",
    tutorWordLimit: 240,
    readAloud: "OPTIONAL",
    visualSupport: "SECONDARY",
    responseModes: ["multiple-choice", "constructed-response", "synthesis"],
    labels: { dashboard: "Dashboard", tutor: "Tutor", study: "Study" },
  };
}

export function tutorPromptForGrade(gradeLevel: string) {
  const config = experienceForGrade(gradeLevel);
  const prompts: Record<GradeBand, string> = {
    EARLY: "Teach a K–2 learner one idea at a time using very short sentences, familiar examples, visible words, and an invitation to listen and say the answer aloud. Avoid unexplained jargon.",
    ELEMENTARY: "Teach a grades 3–5 learner with short paragraphs, concrete examples, visible vocabulary, and friendly check-ins. Define new words before using them.",
    MIDDLE: "Teach a grades 6–8 learner with clear sections, short steps, concrete examples, and occasional evidence checks. Name prerequisite ideas when they matter.",
    HIGH: "Teach a grades 9–12 learner with concise explanations, readable formulas, worked reasoning, and explicit connections to prerequisite ideas.",
  };
  return `${prompts[config.band]} Keep the response under ${config.tutorWordLimit} words.`;
}
