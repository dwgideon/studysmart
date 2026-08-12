import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { getPilotLesson } from "@/lib/pilotCurriculum";
import { evaluateLessonQuality } from "@/lib/curriculumQuality";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).json({ error: "Method not allowed" });}
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const lessonId = typeof req.query.lessonId === "string" ? req.query.lessonId : "";
  const lesson = getPilotLesson(lessonId);
  if (!lesson || lesson.status !== "PUBLISHED") {return res.status(404).json({ error: "Lesson not found" });}
  return res.status(200).json({ lesson, quality: evaluateLessonQuality(lesson) });
}
