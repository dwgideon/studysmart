import { listOriginalSets, type LibraryGrade, type LibrarySubject, type OriginalSet } from "./studyLibrary.ts";

export type StudyPlanMode = "MATERIAL_FIRST" | "BLENDED" | "CURRICULUM_FIRST";

type StudyPlanInput = {
  grade: string;
  subject: string;
  courseName: string;
  learningGoal?: string | null;
  examDate?: Date | null;
  materialTitles: string[];
  materialConcepts: string[];
  now?: Date;
  mode?: StudyPlanMode;
};

type StudyPlanAction = {
  id: string;
  kind: "LEARN" | "PRACTICE" | "RETRIEVE" | "TUTOR" | "GAME" | "UPLOAD";
  title: string;
  reason: string;
  href: string;
  minutes: number;
  source: "UPLOADED_MATERIAL" | "STUDYSMART_ORIGINALS" | "MASTERY_SYSTEM";
  setId?: string;
};

type StudyPlan = {
  mode: StudyPlanMode;
  courseName: string;
  subject: string;
  grade: string;
  examDate: string | null;
  daysRemaining: number | null;
  materialCount: number;
  materialTitles: string[];
  matchedOriginals: OriginalSet[];
  coverage: "MATERIAL_ONLY" | "BLENDED" | "CURRICULUM_STARTER";
  nextBestAction: StudyPlanAction;
  actions: StudyPlanAction[];
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function daysUntil(examDate: Date | null | undefined, now: Date) {
  if (!examDate) {return null;}
  return Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / 86_400_000));
}

function asSubject(subject: string): LibrarySubject | null {
  const normalized = normalize(subject);
  return ["Math", "Science", "Reading", "Grammar", "English", "Writing", "History", "Vocabulary"]
    .find((value) => normalize(value) === normalized) as LibrarySubject | undefined ?? null;
}

function asGrade(grade: string): LibraryGrade | null {
  return ["K", "1", "2", "3", "4", "5", "6", "7", "8"].includes(grade)
    ? grade as LibraryGrade
    : null;
}

function matchesMaterial(set: OriginalSet, materialText: string) {
  const haystack = normalize(materialText);
  const terms = [set.topic, set.summary, ...set.skillTags].map(normalize);
  return terms.reduce((score, term) => score + (term && haystack.includes(term) ? 2 : 0), 0);
}

export function buildStudyPlan(input: StudyPlanInput): StudyPlan {
  const now = input.now ?? new Date();
  const mode = input.mode ?? "BLENDED";
  const daysRemaining = daysUntil(input.examDate, now);
  const materialText = [...input.materialTitles, ...input.materialConcepts].join(" ");
  const subject = asSubject(input.subject);
  const grade = asGrade(input.grade);
  const catalog = grade && subject ? listOriginalSets({ grade, subject }) : [];
  const ranked = [...catalog]
    .map((set) => ({ set, score: matchesMaterial(set, materialText) }))
    .sort((left, right) => right.score - left.score || left.set.id.localeCompare(right.set.id));
  const matchedOriginals = mode === "MATERIAL_FIRST"
    ? ranked.filter((item) => item.score > 0).slice(0, 4).map((item) => item.set)
    : ranked.slice(0, mode === "CURRICULUM_FIRST" ? 6 : 4).map((item) => item.set);
  const materialCount = input.materialTitles.length;
  const coverage = materialCount > 0 && matchedOriginals.length > 0
    ? "BLENDED"
    : materialCount > 0
      ? "MATERIAL_ONLY"
      : "CURRICULUM_STARTER";
  const actions: StudyPlanAction[] = [];
  if (materialCount === 0) {
    actions.push({
      id: "upload-material",
      kind: "UPLOAD",
      title: "Add your teacher material",
      reason: "StudySmart can align the curriculum to the exact notes, packet, or slides on your test.",
      href: "/upload",
      minutes: 5,
      source: "UPLOADED_MATERIAL",
    });
  }
  matchedOriginals.forEach((set, index) => {
    const urgent = daysRemaining !== null && daysRemaining <= 14;
    actions.push({
      id: `learn-${set.id}`,
      kind: "LEARN",
      title: urgent ? `Learn the test-critical ideas in ${set.topic}` : `Build the foundation: ${set.topic}`,
      reason: materialCount > 0
        ? `Blends ${set.title} with your uploaded material so the explanation matches the course and the test.`
        : set.summary,
      href: `/library?grade=${encodeURIComponent(set.grade)}&subject=${encodeURIComponent(set.subject)}&search=${encodeURIComponent(set.topic)}`,
      minutes: Math.min(30, set.estimatedMinutes),
      source: materialCount > 0 ? "UPLOADED_MATERIAL" : "STUDYSMART_ORIGINALS",
      setId: set.id,
    });
    actions.push({
      id: `practice-${set.id}`,
      kind: "PRACTICE",
      title: `Practice ${set.topic}`,
      reason: "Use mixed recall and application questions, then let the mastery model adjust what comes next.",
      href: "/quiz",
      minutes: Math.max(8, Math.round(set.estimatedMinutes * 0.7)),
      source: "MASTERY_SYSTEM",
      setId: set.id,
    });
    if (index === 0) {
      actions.push({
        id: `tutor-${set.id}`,
        kind: "TUTOR",
        title: `Ask the tutor about ${set.topic}`,
        reason: "Get a source-aware explanation, hint, or misconception repair before the next attempt.",
        href: `/tutor?conceptId=${encodeURIComponent(set.id)}`,
        minutes: 10,
        source: materialCount > 0 ? "UPLOADED_MATERIAL" : "STUDYSMART_ORIGINALS",
        setId: set.id,
      });
    }
  });
  actions.push({
    id: "retrieve-and-review",
    kind: "RETRIEVE",
    title: daysRemaining !== null && daysRemaining <= 7 ? "Run an exam-readiness review" : "Review what is starting to fade",
    reason: "Spaced retrieval protects memory instead of relying on one long cram session.",
    href: "/smart",
    minutes: 15,
    source: "MASTERY_SYSTEM",
  });
  actions.push({
    id: "game-reinforcement",
    kind: "GAME",
    title: "Reinforce the hardest ideas in a game",
    reason: "Use gameplay for retrieval practice after the concepts are introduced.",
    href: "/games",
    minutes: 12,
    source: "MASTERY_SYSTEM",
  });
  const nextBestAction = actions.find((action) => action.kind !== "GAME") ?? actions[0];
  return {
    mode,
    courseName: input.courseName,
    subject: input.subject,
    grade: input.grade,
    examDate: input.examDate?.toISOString() ?? null,
    daysRemaining,
    materialCount,
    materialTitles: input.materialTitles.slice(0, 8),
    matchedOriginals,
    coverage,
    nextBestAction,
    actions,
  };
}
