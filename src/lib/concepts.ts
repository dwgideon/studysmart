import { prisma } from "@/lib/prisma";
import { normalizeConceptName } from "@/lib/mastery";

export async function getPrimaryCourse(userId: string) {
  return prisma.course.findFirst({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });
}

export async function enrichQuestionsWithConcepts(
  userId: string,
  rawQuestions: unknown[]
) {
  const course = await getPrimaryCourse(userId);
  if (!course) {
    return { courseId: null, questions: rawQuestions };
  }

  const conceptIds = new Map<string, string>();
  const questions: Array<Record<string, unknown>> = [];

  for (const rawQuestion of rawQuestions) {
    if (!rawQuestion || typeof rawQuestion !== "object") {
      continue;
    }
    const question = rawQuestion as Record<string, unknown>;
    const label =
      typeof question.concept === "string" && question.concept.trim()
        ? question.concept.trim().slice(0, 120)
        : "Core ideas";
    const normalizedName = normalizeConceptName(label) || "core ideas";
    let conceptId = conceptIds.get(normalizedName);

    if (!conceptId) {
      const concept = await prisma.concept.upsert({
        where: {
          courseId_normalizedName: { courseId: course.id, normalizedName },
        },
        create: { courseId: course.id, name: label, normalizedName },
        update: { name: label },
      });
      await prisma.conceptMastery.upsert({
        where: { userId_conceptId: { userId, conceptId: concept.id } },
        create: { userId, conceptId: concept.id },
        update: {},
      });
      conceptId = concept.id;
      conceptIds.set(normalizedName, concept.id);
    }

    questions.push({ ...question, concept: label, conceptId });
  }

  return { courseId: course.id, questions };
}
