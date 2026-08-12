import type { NextApiRequest, NextApiResponse } from "next";
import { listPilotUnits } from "@/lib/pilotCurriculum";
import { evaluateLessonQuality } from "@/lib/curriculumQuality";
import type { LibraryGrade, LibrarySubject } from "@/lib/studyLibrary";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).json({ error: "Method not allowed" });}
  const grade = typeof req.query.grade === "string" ? req.query.grade as LibraryGrade : undefined;
  const subject = typeof req.query.subject === "string" ? req.query.subject as LibrarySubject : undefined;
  const units = listPilotUnits({ grade, subject }).map((unit) => ({
    id: unit.id,
    title: unit.title,
    description: unit.description,
    grade: unit.grade,
    subject: unit.subject,
    status: unit.status,
    lessonCount: unit.lessons.length,
    standards: unit.standards,
    source: unit.source,
    lessons: unit.lessons.map((lesson) => ({ id: lesson.id, sequence: lesson.sequence, title: lesson.title, objective: lesson.learningObjective, status: lesson.status, quality: evaluateLessonQuality(lesson) })),
  }));
  return res.status(200).json({ units, pilot: true, catalogVersion: "2026.08-pilot-1" });
}
