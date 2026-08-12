import { localK12SafetyDecision } from "./k12SafetyRules.ts";
import type { CurriculumLesson, CurriculumStatus, EditorialRole, QuizQuestion } from "./curriculumSchema.ts";

type QualityCheck = {
  id: string;
  label: string;
  passed: boolean;
  severity: "BLOCKER" | "WARNING";
  detail: string;
};

type LessonQualityReport = {
  lessonId: string;
  passed: boolean;
  checks: QualityCheck[];
};

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean);
}

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    const key = normalized(value);
    if (seen.has(key)) {duplicates.add(key);}
    seen.add(key);
  });
  return [...duplicates];
}

function questionQuality(questions: QuizQuestion[]): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const duplicatePrompts = duplicateValues(questions.map((question) => question.prompt));
  checks.push({
    id: "unique-questions",
    label: "No duplicate questions",
    passed: duplicatePrompts.length === 0,
    severity: "BLOCKER",
    detail: duplicatePrompts.length === 0 ? "Every question prompt is unique." : `Duplicate prompts: ${duplicatePrompts.join(", ")}`,
  });
  const invalidKeys = questions.filter((question) => question.options.length < 2 || question.answerIndex < 0 || question.answerIndex >= question.options.length);
  checks.push({
    id: "answer-keys",
    label: "Correct answer keys",
    passed: invalidKeys.length === 0,
    severity: "BLOCKER",
    detail: invalidKeys.length === 0 ? "Every question has a valid answer key." : `Invalid question keys: ${invalidKeys.map((question) => question.id).join(", ")}`,
  });
  const positions = questions.map((question) => question.answerIndex);
  const samePositionRun = positions.some((position, index) => index >= 3 && positions[index - 1] === position && positions[index - 2] === position && positions[index - 3] === position);
  checks.push({
    id: "answer-position-pattern",
    label: "No answer-position patterns",
    passed: !samePositionRun,
    severity: "BLOCKER",
    detail: samePositionRun ? "Four consecutive questions use the same answer position." : "Answer positions are varied.",
  });
  const clueQuestions = questions.filter((question) => {
    const answerWords = words(question.options[question.answerIndex] ?? "").length;
    const distractorWords = question.options.filter((_, index) => index !== question.answerIndex).map((option) => words(option).length);
    return answerWords > 0 && distractorWords.length > 0 && answerWords >= Math.max(...distractorWords) * 2.5;
  });
  checks.push({
    id: "wording-clues",
    label: "No obvious wording clues",
    passed: clueQuestions.length === 0,
    severity: "BLOCKER",
    detail: clueQuestions.length === 0 ? "Correct options are not systematically longer than distractors." : `Potential length clues: ${clueQuestions.map((question) => question.id).join(", ")}`,
  });
  return checks;
}

export function evaluateLessonQuality(lesson: CurriculumLesson): LessonQualityReport {
  const checks: QualityCheck[] = [];
  const objectiveWords = words(lesson.learningObjective);
  checks.push({
    id: "one-clear-objective",
    label: "One clear objective",
    passed: objectiveWords.length >= 5 && objectiveWords.length <= 35 && /\b(can|will|use|identify|explain|compare|read|build|model|solve|describe|sort|trace|analyze|write)\b/i.test(lesson.learningObjective),
    severity: "BLOCKER",
    detail: "The objective is a measurable, learner-facing statement.",
  });
  checks.push({
    id: "standards-alignment",
    label: "Standards alignment",
    passed: lesson.standards.length > 0 && lesson.standards.every((standard) => Boolean(standard.framework && standard.code && standard.statement)),
    severity: "BLOCKER",
    detail: "At least one complete standard reference is attached.",
  });
  checks.push({
    id: "prerequisites",
    label: "Prerequisites are explicit",
    passed: lesson.prerequisiteConcepts.length > 0 && lesson.concepts.length > 0,
    severity: "BLOCKER",
    detail: "The lesson names both prerequisite concepts and the concepts it advances.",
  });
  const requiredText = [lesson.teacherExplanation, lesson.studentExplanation];
  const taskPrompts = [lesson.workedExample.prompt, lesson.exitTicket.prompt];
  const requiredAnswers = [lesson.workedExample.answer, lesson.exitTicket.answer, ...lesson.guidedPractice.flatMap((item) => [item.prompt, item.answer]), ...lesson.independentPractice.flatMap((item) => [item.prompt, item.answer])];
  checks.push({
    id: "content-complete",
    label: "All lesson components present",
    passed: requiredText.every((value) => words(value).length >= 3) && taskPrompts.every((value) => words(value).length >= 2) && requiredAnswers.every((value) => words(value).length >= 1) && lesson.guidedPractice.length >= 2 && lesson.independentPractice.length >= 2 && lesson.misconceptionChecks.length >= 1 && lesson.flashcards.length >= 2 && lesson.quizQuestions.length >= 3,
    severity: "BLOCKER",
    detail: "Explanation, practice, repair, exit ticket, flashcards, and quiz content are present.",
  });
  checks.push({
    id: "readability",
    label: "Appropriate reading level",
    passed: words(lesson.studentExplanation).length <= 180 && lesson.studentExplanation.split(/[.!?]+/).filter(Boolean).every((sentence) => words(sentence).length <=  thirtyFive()),
    severity: "BLOCKER",
    detail: "Student-facing sentences stay short enough for the lesson’s grade band.",
  });
  checks.push({
    id: "accessibility",
    label: "Accessibility support",
    passed: Object.values(lesson.accessibilityAlternatives).every((value) => Array.isArray(value) ? value.length > 0 : words(value).length >= 3),
    severity: "BLOCKER",
    detail: "Visual, spoken, simplified-language, and interaction alternatives are defined.",
  });
  const safetyTexts = [lesson.teacherExplanation, lesson.studentExplanation, lesson.readAloudScript.join(" "), ...lesson.quizQuestions.map((question) => `${question.prompt} ${question.options.join(" ")}`)];
  const unsafe = safetyTexts.map((text) => localK12SafetyDecision(text)).find(Boolean);
  checks.push({
    id: "safe-language",
    label: "Safe language",
    passed: !unsafe,
    severity: "BLOCKER",
    detail: unsafe ? `Safety rule flagged ${unsafe.category}.` : "No safety rule was triggered.",
  });
  checks.push({
    id: "source-license",
    label: "Source and licensing status",
    passed: lesson.source.kind === "ORIGINAL" ? Boolean(lesson.source.attribution && lesson.source.license) : Boolean(lesson.source.license && lesson.source.attribution),
    severity: "BLOCKER",
    detail: `${lesson.source.kind} content includes attribution and license metadata.`,
  });
  checks.push(...questionQuality(lesson.quizQuestions));
  checks.push({
    id: "mastery-rules",
    label: "Mastery evidence rules",
    passed: lesson.masteryEvidenceRules.threshold >= 0.6 && lesson.masteryEvidenceRules.threshold <= 1 && lesson.masteryEvidenceRules.minimumIndependentItems >= 1 && lesson.masteryEvidenceRules.nextReviewDays.length >= 2,
    severity: "BLOCKER",
    detail: "Mastery threshold, independent evidence, and review intervals are defined.",
  });
  checks.push({
    id: "human-approval",
    label: "Human approval",
    passed: lesson.status === "PUBLISHED" ? lesson.source.reviewedBy !== undefined : true,
    severity: "BLOCKER",
    detail: lesson.status === "PUBLISHED" ? "Published lessons identify an educator reviewer." : "Draft lessons require review before publishing.",
  });
  return { lessonId: lesson.id, passed: checks.every((check) => check.passed || check.severity === "WARNING"), checks };
}

function thirtyFive() {
  return 35;
}

export function canPublishLesson(lesson: CurriculumLesson) {
  return evaluateLessonQuality(lesson).passed && lesson.status === "SAFETY_REVIEW";
}

export function nextEditorialStatus(status: CurriculumStatus, role: EditorialRole): CurriculumStatus | null {
  if (status === "DRAFT" && role === "AUTHOR") {return "EDITOR_REVIEW";}
  if (status === "EDITOR_REVIEW" && role === "EDUCATOR") {return "ACCESSIBILITY_REVIEW";}
  if (status === "ACCESSIBILITY_REVIEW" && role === "ACCESSIBILITY") {return "SAFETY_REVIEW";}
  if (status === "SAFETY_REVIEW" && role === "SAFETY") {return "PUBLISHED";}
  if (status === "PUBLISHED" && role === "PUBLISHER") {return "RETIRED";}
  return null;
}
