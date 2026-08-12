import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.ts";
import { PILOT_UNITS } from "./pilotCurriculum.ts";

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

export async function syncPilotCurriculum() {
  return prisma.$transaction(async (tx) => {
    for (const unit of PILOT_UNITS) {
      await tx.curriculumUnit.upsert({
        where: { id: unit.id },
        create: { id: unit.id, version: unit.version, status: unit.status, title: unit.title, description: unit.description, grade: unit.grade, subject: unit.subject, standards: asJson(unit.standards), prerequisiteConcepts: asJson(unit.prerequisiteConcepts), source: asJson(unit.source) },
        update: { version: unit.version, status: unit.status, title: unit.title, description: unit.description, grade: unit.grade, subject: unit.subject, standards: asJson(unit.standards), prerequisiteConcepts: asJson(unit.prerequisiteConcepts), source: asJson(unit.source) },
      });
      for (const lesson of unit.lessons) {
        await tx.curriculumLesson.upsert({
          where: { id: lesson.id },
          create: lessonRow(lesson),
          update: lessonRow(lesson),
        });
        await tx.curriculumConcept.deleteMany({ where: { lessonId: lesson.id } });
        await tx.curriculumConcept.createMany({ data: lesson.concepts.map((concept) => ({ id: concept.id, lessonId: lesson.id, name: concept.name, description: concept.description, prerequisiteIds: asJson(concept.prerequisiteIds ?? []) })) });
        await tx.curriculumQuestion.deleteMany({ where: { lessonId: lesson.id } });
        await tx.curriculumQuestion.createMany({ data: lesson.quizQuestions.map((question) => ({ id: question.id, lessonId: lesson.id, prompt: question.prompt, options: asJson(question.options), answerIndex: question.answerIndex, explanation: question.explanation, conceptKey: question.conceptId, difficulty: question.difficulty })) });
        await tx.curriculumFlashcard.deleteMany({ where: { lessonId: lesson.id } });
        await tx.curriculumFlashcard.createMany({ data: lesson.flashcards.map((card) => ({ id: card.id, lessonId: lesson.id, front: card.front, back: card.back, conceptKey: card.conceptId })) });
        await tx.curriculumGamePrompt.deleteMany({ where: { lessonId: lesson.id } });
        await tx.curriculumGamePrompt.create({ data: { id: `${lesson.id}-game`, lessonId: lesson.id, mode: "KNOWLEDGE_GRID", prompt: asJson({ prompt: `Use ${lesson.title} in a retrieval round.`, conceptIds: lesson.concepts.map((concept) => concept.id) }) } });
        await tx.curriculumTutorPrompt.deleteMany({ where: { lessonId: lesson.id } });
        await tx.curriculumTutorPrompt.create({ data: { id: `${lesson.id}-tutor`, lessonId: lesson.id, prompt: `Teach ${lesson.learningObjective} using the student-friendly explanation, then ask for a new example.`, context: asJson({ source: lesson.source, misconceptionChecks: lesson.misconceptionChecks }) } });
        await tx.curriculumReviewSchedule.upsert({ where: { lessonId_version: { lessonId: lesson.id, version: lesson.version } }, create: { lessonId: lesson.id, version: lesson.version, intervalsDays: asJson(lesson.reviewSchedule.intervalsDays), retentionTarget: lesson.reviewSchedule.retentionTarget, masteryThreshold: lesson.masteryEvidenceRules.threshold }, update: { intervalsDays: asJson(lesson.reviewSchedule.intervalsDays), retentionTarget: lesson.reviewSchedule.retentionTarget, masteryThreshold: lesson.masteryEvidenceRules.threshold } });
      }
    }
    return { units: PILOT_UNITS.length, lessons: PILOT_UNITS.reduce((sum, unit) => sum + unit.lessons.length, 0) };
  }, { timeout: 120_000, maxWait: 10_000 });
}

function lessonRow(lesson: (typeof PILOT_UNITS)[number]["lessons"][number]) {
  const published = lesson.status === "PUBLISHED";
  return {
    id: lesson.id,
    unitId: lesson.unitId,
    version: lesson.version,
    schemaVersion: lesson.schemaVersion,
    status: lesson.status,
    sequence: lesson.sequence,
    title: lesson.title,
    grade: lesson.grade,
    subject: lesson.subject,
    learningObjective: lesson.learningObjective,
    prerequisites: asJson(lesson.prerequisiteConcepts),
    standards: asJson(lesson.standards),
    teacherExplanation: lesson.teacherExplanation,
    studentExplanation: lesson.studentExplanation,
    workedExample: asJson(lesson.workedExample),
    guidedPractice: asJson(lesson.guidedPractice),
    independentPractice: asJson(lesson.independentPractice),
    misconceptionChecks: asJson(lesson.misconceptionChecks),
    exitTicket: asJson(lesson.exitTicket),
    readAloudScript: asJson(lesson.readAloudScript),
    accessibilityAlternatives: asJson(lesson.accessibilityAlternatives),
    remediationPath: asJson(lesson.remediationPath),
    extensionPath: asJson(lesson.extensionPath),
    masteryEvidenceRules: asJson(lesson.masteryEvidenceRules),
    reviewSchedule: asJson(lesson.reviewSchedule),
    source: asJson(lesson.source),
    humanApprovedAt: published ? new Date() : null,
    educatorReviewer: lesson.source.reviewedBy ?? null,
    accessibilityReviewedAt: published ? new Date() : null,
    safetyReviewedAt: published ? new Date() : null,
    publishedAt: published ? new Date() : null,
  };
}
