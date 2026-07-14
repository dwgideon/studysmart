import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { recordMasteryEvidence } from "@/lib/masteryService";

type QuestionPayload = {
  conceptId?: unknown;
  answer?: unknown;
  correctAnswer?: unknown;
  difficulty?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {return res.status(405).end();}

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const { title, source, questions, answers, conversationId, sourceMaterialId } = req.body;

  if (!title || !questions) {
    return res.status(400).json({ error: "Missing title or questions" });
  }

  try {
    const questionList = Array.isArray(questions) ? (questions as QuestionPayload[]) : [];
    const answerMap = answers && typeof answers === "object"
      ? (answers as Record<string, string>)
      : {};
    const outcomes = questionList.map((question, index) => {
      const expected =
        typeof question.answer === "string"
          ? question.answer
          : typeof question.correctAnswer === "string"
            ? question.correctAnswer
            : null;
      const submitted = answerMap[String(index)];
      return {
        conceptId: typeof question.conceptId === "string" ? question.conceptId : null,
        correct: Boolean(expected && submitted === expected),
        difficulty: Math.max(0, Math.min(1, (Number(question.difficulty) || 3) / 5)),
      };
    });
    const score = outcomes.filter((outcome) => outcome.correct).length;
    const total = questionList.length;
    const conceptIds = [...new Set(outcomes.flatMap((item) => item.conceptId ?? []))];
    const ownedConcepts = await prisma.concept.findMany({
      where: { id: { in: conceptIds }, course: { userId: user.id } },
      select: { id: true, courseId: true },
    });
    const ownedIds = new Set(ownedConcepts.map((concept) => concept.id));
    const ownedConversation = conversationId
      ? await prisma.tutorConversation.findFirst({
          where: { id: conversationId, userId: user.id },
          select: { id: true, courseId: true, sourceMaterialId: true },
        })
      : null;
    const ownedSourceMaterial = sourceMaterialId
      ? await prisma.sourceMaterial.findFirst({
          where: { id: sourceMaterialId, userId: user.id },
          select: { id: true, courseId: true },
        })
      : null;

    const saved = await prisma.$transaction(async (tx) => {
      const quiz = await tx.savedQuiz.create({
        data: {
          userId: user.id,
          courseId:
            ownedConcepts[0]?.courseId ??
            ownedConversation?.courseId ??
            ownedSourceMaterial?.courseId ??
            null,
          conversationId: ownedConversation?.id ?? null,
          sourceMaterialId: ownedSourceMaterial?.id ?? null,
          title: String(title).slice(0, 160),
          source: typeof source === "string" ? source : "app",
          questions,
          score,
          total,
        },
      });

      const grouped = new Map<string, { correct: number; total: number }>();
      for (const outcome of outcomes) {
        if (!outcome.conceptId || !ownedIds.has(outcome.conceptId)) {
          continue;
        }
        const counts = grouped.get(outcome.conceptId) ?? { correct: 0, total: 0 };
        counts.total += 1;
        counts.correct += outcome.correct ? 1 : 0;
        grouped.set(outcome.conceptId, counts);

        await recordMasteryEvidence(tx, {
          userId: user.id,
          conceptId: outcome.conceptId,
          sourceType: "QUIZ_RESPONSE",
          sourceId: quiz.id,
          correct: outcome.correct,
          difficulty: outcome.difficulty,
          independent: true,
        });
      }

      for (const [conceptId, counts] of grouped) {
        await tx.quizConceptResult.create({
          data: {
            savedQuizId: quiz.id,
            conceptId,
            correctCount: counts.correct,
            totalCount: counts.total,
          },
        });
      }
      return quiz;
    });

    res.status(200).json({ success: true, quizId: saved.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save quiz" });
  }
}
