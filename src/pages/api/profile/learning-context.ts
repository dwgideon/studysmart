import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import {
  cleanText,
  GRADE_LEVEL_VALUES,
  type LearningContextPayload,
} from "@/lib/learningProfile";

function serializeDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) {
    return;
  }

  if (req.method === "GET") {
    const [account, profile, courses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { ageGroup: true },
      }),
      prisma.learnerProfile.findUnique({ where: { userId: user.id } }),
      prisma.course.findMany({
        where: { userId: user.id },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      }),
    ]);

    return res.status(200).json({
      user: account,
      profile,
      courses: courses.map((course) => ({
        ...course,
        examDate: serializeDate(course.examDate),
      })),
    });
  }

  if (req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as Partial<LearningContextPayload>;
  const gradeLevel = cleanText(body.gradeLevel, 32);
  const ageGroup = cleanText(body.ageGroup, 20).toUpperCase();
  const primaryLearningGoal = cleanText(body.primaryLearningGoal, 500);
  const courseId = cleanText(body.courseId, 64);
  const courseName = cleanText(body.courseName, 120);
  const subject = cleanText(body.subject, 80);
  const courseLearningGoal = cleanText(body.courseLearningGoal, 500);
  const examDateInput = cleanText(body.examDate, 10);

  if (!GRADE_LEVEL_VALUES.has(gradeLevel)) {
    return res.status(400).json({ error: "Choose a valid grade level." });
  }

  if (!["UNDER_13", "TEEN", "ADULT"].includes(ageGroup)) {
    return res.status(400).json({ error: "Choose a valid age group." });
  }

  if (!courseName || !subject) {
    return res
      .status(400)
      .json({ error: "Course name and subject are required." });
  }

  let examDate: Date | null = null;
  if (examDateInput) {
    examDate = new Date(`${examDateInput}T12:00:00.000Z`);
    if (Number.isNaN(examDate.getTime())) {
      return res.status(400).json({ error: "Enter a valid exam date." });
    }
  }

  if (courseId) {
    const ownedCourse = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true },
    });
    if (!ownedCourse) {
      return res.status(404).json({ error: "Course not found." });
    }
  }

  const [, course] = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { ageGroup },
    });
    const profile = await tx.learnerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        gradeLevel,
        primaryLearningGoal: primaryLearningGoal || null,
        onboardingCompleted: true,
      },
      update: {
        gradeLevel,
        primaryLearningGoal: primaryLearningGoal || null,
        onboardingCompleted: true,
      },
    });

    await tx.course.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    });

    const savedCourse = courseId
      ? await tx.course.update({
          where: { id: courseId },
          data: {
            name: courseName,
            subject,
            examDate,
            learningGoal: courseLearningGoal || null,
            isPrimary: true,
          },
        })
      : await tx.course.create({
          data: {
            userId: user.id,
            name: courseName,
            subject,
            examDate,
            learningGoal: courseLearningGoal || null,
            isPrimary: true,
          },
        });

    return [profile, savedCourse] as const;
  });

  return res.status(200).json({
    ok: true,
    requiresGuardianConsent: ageGroup === "UNDER_13",
    course: { ...course, examDate: serializeDate(course.examDate) },
  });
}
