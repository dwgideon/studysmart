import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPilotLesson } from "@/lib/pilotCurriculum";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {return res.status(405).json({ error: "Method not allowed" });}
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { accountRole: true } });
  if (!account || !["TEACHER", "GUARDIAN"].includes(account.accountRole)) {return res.status(403).json({ error: "Teacher or guardian role required." });}
  const body = req.body as { lessonId?: string; rating?: number; comment?: string; learnerId?: string };
  if (!body.lessonId || !getPilotLesson(body.lessonId) || !Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5) {return res.status(400).json({ error: "Lesson and a 1–5 rating are required." });}
  await prisma.curriculumLessonEvent.create({ data: { userId: user.id, lessonId: body.lessonId, eventType: `${account.accountRole}_FEEDBACK`, payload: { rating: body.rating, comment: typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "", learnerId: body.learnerId ?? null } } });
  return res.status(204).end();
}
