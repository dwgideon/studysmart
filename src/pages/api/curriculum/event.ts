import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPilotLesson } from "@/lib/pilotCurriculum";

const ALLOWED_EVENTS = new Set(["LESSON_VIEWED", "READ_ALOUD_USED", "ACCESSIBILITY_USED", "GUIDED_HINT_USED", "MISCONCEPTION_REPAIR_VIEWED", "LESSON_DROPPED"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {return res.status(405).json({ error: "Method not allowed" });}
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const body = req.body as { lessonId?: string; eventType?: string; payload?: Record<string, unknown> };
  if (!body.lessonId || !getPilotLesson(body.lessonId) || !body.eventType || !ALLOWED_EVENTS.has(body.eventType)) {return res.status(400).json({ error: "Invalid curriculum event" });}
  await prisma.curriculumLessonEvent.create({ data: { userId: user.id, lessonId: body.lessonId, eventType: body.eventType, payload: body.payload as never } });
  return res.status(204).end();
}
