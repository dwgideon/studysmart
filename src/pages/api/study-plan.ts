import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStudyPlan, type StudyPlanMode } from "@/lib/studyPlanner";

function safeMode(value: unknown): StudyPlanMode {
  return value === "MATERIAL_FIRST" || value === "CURRICULUM_FIRST" ? value : "BLENDED";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const courseId = typeof (req.method === "GET" ? req.query.courseId : req.body?.courseId) === "string"
    ? (req.method === "GET" ? req.query.courseId : req.body.courseId)
    : undefined;
  const mode = safeMode(req.method === "GET" ? req.query.mode : req.body?.mode);
  const [profile, course, materials] = await Promise.all([
    prisma.learnerProfile.findUnique({ where: { userId: user.id }, select: { gradeLevel: true } }),
    prisma.course.findFirst({
      where: { userId: user.id, ...(courseId ? { id: courseId } : {}) },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.sourceMaterial.findMany({
      where: { userId: user.id, ...(courseId ? { courseId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
  ]);

  if (!profile?.gradeLevel || !course) {
    return res.status(409).json({
      code: "LEARNING_CONTEXT_REQUIRED",
      error: "Set your grade, subject, course, and exam date before building a personalized study plan.",
      actionPath: "/onboarding",
    });
  }

  const plan = buildStudyPlan({
    grade: profile.gradeLevel,
    subject: course.subject,
    courseName: course.name,
    learningGoal: course.learningGoal,
    examDate: course.examDate,
    materialTitles: materials.map((material) => material.title),
    materialConcepts: materials.flatMap((material) => material.content.slice(0, 6_000).split(/\s+/).slice(0, 180)),
    mode,
  });

  return res.status(200).json({
    course: {
      id: course.id,
      name: course.name,
      subject: course.subject,
      examDate: course.examDate?.toISOString() ?? null,
      learningGoal: course.learningGoal,
    },
    sources: materials.map((material) => ({ id: material.id, title: material.title, createdAt: material.createdAt.toISOString() })),
    plan,
  });
}
