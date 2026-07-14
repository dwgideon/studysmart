import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const user = await requireApiUser(req, res);
  if (!user) {
    return;
  }

  const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
  const masteries = await prisma.conceptMastery.findMany({
    where: {
      userId: user.id,
      concept: {
        course: { userId: user.id },
        ...(courseId ? { courseId } : {}),
      },
    },
    include: {
      concept: {
        include: { course: { select: { id: true, name: true, subject: true } } },
      },
    },
    orderBy: [{ score: "asc" }, { updatedAt: "desc" }],
  });

  const average = masteries.length
    ? masteries.reduce((sum, mastery) => sum + mastery.score, 0) / masteries.length
    : 0;

  return res.status(200).json({
    summary: {
      totalConcepts: masteries.length,
      averageScore: Math.round(average * 100),
      mastered: masteries.filter((mastery) => mastery.status === "MASTERED").length,
      needsWork: masteries.filter((mastery) => mastery.status !== "MASTERED").length,
    },
    concepts: masteries.map((mastery) => ({
      id: mastery.concept.id,
      name: mastery.concept.name,
      course: mastery.concept.course,
      score: Math.round(mastery.score * 100),
      confidence: Math.round(mastery.confidence * 100),
      uncertainty: Math.round(mastery.uncertainty * 100),
      status: mastery.status,
      attempts: mastery.attempts,
      correctCount: mastery.correctCount,
      incorrectCount: mastery.incorrectCount,
      lastPracticedAt: mastery.lastPracticedAt?.toISOString() ?? null,
      nextReviewAt: mastery.nextReviewAt?.toISOString() ?? null,
    })),
  });
}
