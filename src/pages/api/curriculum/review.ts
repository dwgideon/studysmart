import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPublishLesson, evaluateLessonQuality, nextEditorialStatus } from "@/lib/curriculumQuality";
import { getPilotLesson } from "@/lib/pilotCurriculum";
import type { EditorialRole } from "@/lib/curriculumSchema";

const REVIEW_ROLES = new Set(["EDUCATOR", "ACCESSIBILITY", "SAFETY", "PUBLISHER"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { accountRole: true } });
  if (req.method === "GET") {
    const lessonId = typeof req.query.lessonId === "string" ? req.query.lessonId : "";
    const lesson = getPilotLesson(lessonId);
    if (!lesson) {return res.status(404).json({ error: "Lesson not found" });}
    return res.status(200).json({ lessonId, quality: evaluateLessonQuality(lesson), workflow: { current: lesson.status, nextRoles: ["AUTHOR", "EDUCATOR", "ACCESSIBILITY", "SAFETY", "PUBLISHER"] } });
  }
  if (req.method !== "POST") {return res.status(405).json({ error: "Method not allowed" });}
  if (!account || !REVIEW_ROLES.has(account.accountRole)) {return res.status(403).json({ error: "Only educator, accessibility, safety, or publisher accounts can approve curriculum." });}
  const body = req.body as { lessonId?: string; role?: EditorialRole; action?: "APPROVE" | "RETIRE" };
  const lesson = body.lessonId ? getPilotLesson(body.lessonId) : null;
  if (!lesson || !body.role || !body.action) {return res.status(400).json({ error: "Lesson, role, and action are required." });}
  const report = evaluateLessonQuality(lesson);
  if (body.action === "APPROVE" && !report.passed) {return res.status(422).json({ error: "Quality gate failed.", quality: report });}
  const next = body.action === "RETIRE" ? "RETIRED" : nextEditorialStatus(lesson.status, body.role);
  if (!next || (body.action === "APPROVE" && lesson.status === "PUBLISHED" && !canPublishLesson({ ...lesson, status: "SAFETY_REVIEW" }))) {return res.status(409).json({ error: "That review step is not valid for the current lesson status.", current: lesson.status, role: body.role });}
  const now = new Date();
  const updated = await prisma.curriculumLesson.update({ where: { id: lesson.id }, data: { status: next, ...(body.role === "EDUCATOR" ? { educatorReviewer: user.id } : {}), ...(body.role === "EDUCATOR" ? { humanApprovedAt: now } : {}), ...(body.role === "ACCESSIBILITY" ? { accessibilityReviewedAt: now } : {}), ...(body.role === "SAFETY" ? { safetyReviewedAt: now } : {}), ...(next === "PUBLISHED" ? { publishedAt: now } : {}) } });
  return res.status(200).json({ lessonId: updated.id, status: updated.status, quality: report });
}
