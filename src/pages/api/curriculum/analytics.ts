import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).json({ error: "Method not allowed" });}
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const [attempts, events] = await Promise.all([
    prisma.curriculumLessonAttempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 200, include: { lesson: { select: { id: true, title: true, grade: true, subject: true, unit: { select: { id: true, title: true } } } } } }),
    prisma.curriculumLessonEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);
  const completed = attempts.filter((attempt) => attempt.status === "COMPLETED");
  const score = completed.length ? completed.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / completed.length : 0;
  const eventCount = (eventType: string) => events.filter((event) => event.eventType === eventType).length;
  return res.status(200).json({
    summary: { attempts: attempts.length, completed: completed.length, averageExitTicket: completed.length ? completed.filter((attempt) => attempt.exitTicketCorrect).length / completed.length : 0, averageScore: score, readAloudUsage: eventCount("READ_ALOUD_USED"), accessibilityUsage: eventCount("ACCESSIBILITY_USED"), teacherFeedback: eventCount("TEACHER_FEEDBACK"), guardianFeedback: eventCount("GUARDIAN_FEEDBACK") },
    lessons: completed.map((attempt) => ({ lesson: attempt.lesson, score: attempt.score, exitTicketCorrect: attempt.exitTicketCorrect, durationMs: attempt.durationMs, completedAt: attempt.completedAt })),
    events: events.map((event) => ({ type: event.eventType, lessonId: event.lessonId, createdAt: event.createdAt, payload: event.payload })),
  });
}
