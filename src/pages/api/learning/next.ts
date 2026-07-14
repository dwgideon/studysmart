import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { expectedLearningPriority } from "@/lib/mastery";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const [profile, course, privacy] = await Promise.all([
    prisma.learnerProfile.findUnique({ where: { userId: user.id } }),
    prisma.course.findFirst({
      where: { userId: user.id },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.privacySettings.findUnique({ where: { userId: user.id } }),
  ]);
  if (!profile?.onboardingCompleted || !course) {
    return res.status(200).json({
      recommendation: {
        mode: "ONBOARDING",
        title: "Build your learning path",
        reason: "Grade, course, and goal information are needed before StudySmart can choose the right next step.",
        actionPath: "/onboarding",
        actionLabel: "Personalize learning",
      },
    });
  }
  if (!profile.diagnosticCompleted) {
    return res.status(200).json({
      recommendation: {
        mode: "DIAGNOSTIC",
        title: "Find your strongest starting point",
        reason: "A short adaptive check will estimate readiness and identify prerequisite gaps.",
        actionPath: "/diagnostic",
        actionLabel: "Take adaptive check",
      },
    });
  }
  if (privacy?.aiPersonalizationEnabled === false) {
    return res.status(200).json({
      recommendation: {
        mode: "PRIVATE_GENERIC",
        title: "Choose your next practice",
        reason: "Personalized selection is off in the Trust Center, so no mastery data was used.",
        actionPath: "/study",
        actionLabel: "Open practice",
      },
    });
  }

  const masteries = await prisma.conceptMastery.findMany({
    where: { userId: user.id, concept: { courseId: course.id } },
    include: {
      concept: {
        include: {
          prerequisites: {
            include: {
              prerequisite: {
                include: {
                  masteries: { where: { userId: user.id }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });
  if (masteries.length === 0) {
    return res.status(200).json({
      recommendation: {
        mode: "ADD_MATERIAL",
        title: "Add class material",
        reason: "StudySmart needs a source to create concepts, practice, and evidence-backed citations.",
        actionPath: "/upload",
        actionLabel: "Add material",
      },
    });
  }

  const examUrgency = course.examDate
    ? Math.max(0, Math.min(1, 1 - (course.examDate.getTime() - Date.now()) / (30 * 86_400_000)))
    : 0;
  const ranked = masteries.map((mastery) => {
    const prerequisiteGap = mastery.concept.prerequisites.reduce((gap, edge) => {
      const prerequisiteScore = edge.prerequisite.masteries[0]?.score ?? 0.2;
      return Math.max(gap, (1 - prerequisiteScore) * edge.strength);
    }, 0);
    return {
      mastery,
      prerequisiteGap,
      priority: expectedLearningPriority({
        score: mastery.score,
        uncertainty: mastery.uncertainty,
        nextReviewAt: mastery.nextReviewAt,
        prerequisiteGap,
        examUrgency,
      }),
    };
  }).sort((a, b) => b.priority - a.priority);
  const selected = ranked[0];
  const prerequisite = selected.mastery.concept.prerequisites
    .map((edge) => edge.prerequisite)
    .sort((a, b) => (a.masteries[0]?.score ?? 0.2) - (b.masteries[0]?.score ?? 0.2))[0];
  const concept = selected.prerequisiteGap > 0.45 && prerequisite
    ? prerequisite
    : selected.mastery.concept;
  const due = Boolean(
    selected.mastery.nextReviewAt && selected.mastery.nextReviewAt <= new Date()
  );
  const mode = selected.prerequisiteGap > 0.45
    ? "PREREQUISITE_REPAIR"
    : selected.mastery.uncertainty > 0.62
      ? "CALIBRATION_CHECK"
      : due
        ? "RETRIEVAL_REVIEW"
        : "GUIDED_PRACTICE";
  const reason = mode === "PREREQUISITE_REPAIR"
    ? `${concept.name} is a prerequisite gap that is limiting progress in ${selected.mastery.concept.name}.`
    : mode === "CALIBRATION_CHECK"
      ? `StudySmart needs one short independent check to reduce uncertainty about ${concept.name}.`
      : mode === "RETRIEVAL_REVIEW"
        ? `${concept.name} is due now based on its predicted forgetting curve.`
        : `${concept.name} currently offers the highest expected learning gain for this course.`;
  return res.status(200).json({
    recommendation: {
      mode,
      conceptId: concept.id,
      title: `Next: ${concept.name}`,
      reason,
      expectedLearningPriority: selected.priority,
      confidence: Math.round((1 - selected.mastery.uncertainty) * 100),
      actionPath: due ? "/smart" : `/tutor?conceptId=${encodeURIComponent(concept.id)}`,
      actionLabel: due ? "Review now" : "Start guided practice",
    },
  });
}
