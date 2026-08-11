import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { buildMasteryInsight } from "@/lib/masteryInsights";
import type { MasteryStatus } from "@/lib/mastery";

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
        include: {
          course: { select: { id: true, name: true, subject: true, examDate: true } },
          prerequisites: {
            include: {
              prerequisite: {
                include: {
                  masteries: {
                    where: { userId: user.id },
                    select: { score: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ score: "asc" }, { updatedAt: "desc" }],
  });

  const concepts = masteries.map((mastery) => {
    const prerequisiteGap = mastery.concept.prerequisites.reduce((gap, edge) => {
      const prerequisiteScore = edge.prerequisite.masteries[0]?.score ?? 0.2;
      return Math.max(gap, (1 - prerequisiteScore) * edge.strength);
    }, 0);
    const examUrgency = mastery.concept.course.examDate
      ? Math.max(0, Math.min(1, 1 - (mastery.concept.course.examDate.getTime() - Date.now()) / (30 * 86_400_000)))
      : 0;
    const insight = buildMasteryInsight({
      mastery: {
        ...mastery,
        status: mastery.status as MasteryStatus,
      },
      prerequisiteGap,
      examUrgency,
    });
    return {
      id: mastery.concept.id,
      name: mastery.concept.name,
      course: mastery.concept.course,
      score: Math.round(insight.score * 100),
      confidence: Math.round(insight.confidence * 100),
      uncertainty: Math.round(mastery.uncertainty * 100),
      status: insight.status,
      attempts: mastery.attempts,
      correctCount: mastery.correctCount,
      incorrectCount: mastery.incorrectCount,
      lastPracticedAt: mastery.lastPracticedAt?.toISOString() ?? null,
      nextReviewAt: mastery.nextReviewAt?.toISOString() ?? null,
      due: insight.due,
      predictedRetention: Math.round(insight.predictedRetention * 100),
      priority: insight.priority,
      prerequisiteGap: Math.round(insight.prerequisiteGap * 100),
      recommendedMode: insight.recommendedMode,
    };
  }).sort((left, right) => right.priority - left.priority);
  const average = concepts.length
    ? concepts.reduce((sum, concept) => sum + concept.score, 0) / concepts.length
    : 0;

  return res.status(200).json({
    summary: {
      totalConcepts: concepts.length,
      averageScore: Math.round(average),
      mastered: concepts.filter((concept) => concept.status === "MASTERED").length,
      needsWork: concepts.filter((concept) => concept.status !== "MASTERED").length,
    },
    concepts,
  });
}
