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

export function tutorPromptForGrade(gradeLevel: string) {
  const band = gradeBandFor(gradeLevel);
  const prompts: Record<GradeBand, string> = {
    EARLY:
      "Teach a K–2 learner using one idea at a time, very short sentences, familiar examples, and encouraging check-ins. Avoid unexplained jargon. Stay under 100 words.",
    ELEMENTARY:
      "Teach a grades 3–5 learner with short paragraphs, concrete examples, friendly check-ins, and no unnecessary jargon. Stay under 150 words.",
    MIDDLE:
      "Teach a grades 6–8 learner with clear sections, short steps, and concrete examples. Stay under 200 words.",
    HIGH:
      "Teach a grades 9–12 learner with concise explanations, readable formulas, worked reasoning, and connections to prerequisite ideas.",
  };
  return prompts[band];
}
