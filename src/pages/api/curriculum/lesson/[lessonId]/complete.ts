import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { databaseTransaction, prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/xp";
import { updateUserStreak } from "@/lib/streakService";
import { normalizeConceptName } from "@/lib/mastery";
import { recordMasteryEvidence } from "@/lib/masteryService";
import { getPilotLesson } from "@/lib/pilotCurriculum";
import { syncPilotCurriculum } from "@/lib/curriculumRepository";

type ResponseItem = { id?: string; kind?: string; answer?: string | number; correct?: boolean };

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function answerMatches(actual: string, expected: string) {
  const a = normalize(actual);
  const e = normalize(expected);
  return a === e || (e.length >= 5 && a.includes(e)) || (a.length >= 5 && e.includes(a));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {return res.status(405).json({ error: "Method not allowed" });}
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const lessonId = typeof req.query.lessonId === "string" ? req.query.lessonId : "";
  const lesson = getPilotLesson(lessonId);
  if (!lesson || lesson.status !== "PUBLISHED") {return res.status(404).json({ error: "Lesson not found" });}
  const body = req.body as { courseId?: string; responses?: ResponseItem[]; exitTicketAnswer?: string; exitTicketCorrect?: boolean; durationMs?: number };
  const responses = Array.isArray(body.responses) ? body.responses : [];
  const course = await prisma.course.findFirst({ where: { userId: user.id, ...(body.courseId ? { id: body.courseId } : {}) }, orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }] });
  if (!course) {return res.status(409).json({ code: "LEARNING_CONTEXT_REQUIRED", error: "Choose a course before completing a curriculum lesson." });}

  const quizResults = lesson.quizQuestions.map((question) => {
    const response = responses.find((item) => item.id === question.id);
    return { id: question.id, kind: "QUIZ", conceptId: question.conceptId, correct: Number(response?.answer) === question.answerIndex };
  });
  const practiceResults = [...lesson.guidedPractice, ...lesson.independentPractice].map((practice) => {
    const response = responses.find((item) => item.id === practice.id);
    const correct = response?.correct === true || (typeof response?.answer === "string" && answerMatches(response.answer, practice.answer));
    return { id: practice.id, kind: "PRACTICE", conceptId: lesson.concepts[0]?.id, correct };
  });
  const exitCorrect = body.exitTicketCorrect === true || (typeof body.exitTicketAnswer === "string" && answerMatches(body.exitTicketAnswer, lesson.exitTicket.answer));
  const evidence = [...quizResults, ...practiceResults, { id: "exit-ticket", kind: "EXIT_TICKET", conceptId: lesson.concepts[0]?.id, correct: exitCorrect }];
  const correctCount = evidence.filter((item) => item.correct).length;
  const score = evidence.length ? correctCount / evidence.length : 0;
  const mastered = score >= lesson.masteryEvidenceRules.threshold && practiceResults.filter((item) => item.correct).length >= lesson.masteryEvidenceRules.minimumIndependentItems && exitCorrect;

  try {
    // This is idempotent content sync: it guarantees the curriculum FK exists before recording learner evidence.
    await syncPilotCurriculum();
    const result = await databaseTransaction(async (tx) => {
      const concepts = await Promise.all(lesson.concepts.map((curriculumConcept) => tx.concept.upsert({
        where: { courseId_normalizedName: { courseId: course.id, normalizedName: normalizeConceptName(curriculumConcept.name) } },
        create: { courseId: course.id, name: curriculumConcept.name, normalizedName: normalizeConceptName(curriculumConcept.name), description: curriculumConcept.description, standardFramework: lesson.standards[0]?.framework, standardCode: lesson.standards[0]?.code, gradeBand: lesson.grade, domain: lesson.subject },
        update: { description: curriculumConcept.description, standardFramework: lesson.standards[0]?.framework, standardCode: lesson.standards[0]?.code, gradeBand: lesson.grade, domain: lesson.subject },
      })));
      const mastery = [];
      for (const concept of concepts) {
        mastery.push(await recordMasteryEvidence(tx, { userId: user.id, conceptId: concept.id, sourceType: "CURRICULUM_LESSON", sourceId: lesson.id, correct: mastered, difficulty: 0.55, independent: true }));
      }
      const attempt = await tx.curriculumLessonAttempt.create({ data: { userId: user.id, lessonId, courseId: course.id, status: "COMPLETED", responses: responses as never, evidence: evidence as never, score, exitTicketCorrect: exitCorrect, durationMs: typeof body.durationMs === "number" ? Math.max(0, Math.round(body.durationMs)) : null, completedAt: new Date() } });
      await tx.curriculumLessonEvent.create({ data: { userId: user.id, lessonId, eventType: "LESSON_COMPLETED", payload: { score, mastered, correctCount, total: evidence.length, exitTicketCorrect: exitCorrect } } });
      await updateUserStreak(user.id, tx);
      const xp = await awardXp(user.id, mastered ? 35 : 15, tx);
      return { attempt, mastery, xp };
    });
    return res.status(200).json({ attemptId: result.attempt.id, score: Math.round(score * 100), mastered, xp: result.xp, mastery: result.mastery.map((row) => ({ conceptId: row.conceptId, score: Math.round(row.score * 100), nextReviewAt: row.nextReviewAt?.toISOString() ?? null })), nextStep: mastered ? lesson.extensionPath : lesson.remediationPath });
  } catch (error) {
    console.error("curriculum lesson completion error:", error);
    return res.status(500).json({ error: "We could not save that lesson yet. Your answers are safe; please try again." });
  }
}
