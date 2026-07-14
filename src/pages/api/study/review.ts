import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { recordMasteryEvidence } from "@/lib/masteryService";
import { scheduleNextReview } from "@/lib/spacedRepetition";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const user = await requireApiUser(req, res);
  if (!user) {
    return;
  }

  const { cardId, sessionId, correct } = req.body;
  const rating = [1, 2, 3, 4].includes(Number(req.body?.rating))
    ? Number(req.body.rating) as 1 | 2 | 3 | 4
    : (correct ? 3 : 1);
  const responseTimeMs = Number.isFinite(Number(req.body?.responseTimeMs))
    ? Math.max(0, Math.min(3_600_000, Number(req.body.responseTimeMs)))
    : null;
  const hintCount = Number.isFinite(Number(req.body?.hintCount))
    ? Math.max(0, Math.min(10, Number(req.body.hintCount)))
    : 0;

  if (!cardId) {
    return res.status(400).json({ error: "Missing cardId" });
  }

  try {
    const card = await prisma.flashcard.findFirst({
      where: { id: cardId, userId: user.id },
      select: {
        id: true,
        conceptId: true,
        intervalDays: true,
        easeFactor: true,
        scheduledReviewCount: true,
        lapseCount: true,
        memoryStability: true,
        memoryDifficulty: true,
        targetRetention: true,
      },
    });
    if (!card) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    if (sessionId) {
      const owned = await prisma.studySession.findFirst({
        where: { id: sessionId, userId: user.id },
      });
      if (!owned) {
        return res.status(404).json({ error: "Session not found" });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.cardReview.create({
        data: {
          userId: user.id,
          flashcardId: card.id,
          sessionId: sessionId ?? null,
          correct: Boolean(correct),
          responseTimeMs,
          hintCount,
          rating,
        },
      });

      if (sessionId) {
        await tx.studySession.update({
          where: { id: sessionId },
          data: correct
            ? { correct: { increment: 1 } }
            : { incorrect: { increment: 1 } },
        });
      }

      let mastery = null;
      let masteryScore = 0;

      if (card.conceptId) {
        const recorded = await recordMasteryEvidence(tx, {
          userId: user.id,
          conceptId: card.conceptId,
          sourceType: "FLASHCARD_REVIEW",
          sourceId: card.id,
          correct: Boolean(correct),
          difficulty: card.memoryDifficulty / 10,
          responseTimeMs,
          hintCount,
          independent: hintCount === 0,
        });
        masteryScore = recorded.score;
        mastery = {
          score: recorded.score,
          confidence: recorded.confidence,
          status: recorded.status,
        };
      }

      const schedule = scheduleNextReview({
        correct: Boolean(correct),
        intervalDays: card.intervalDays,
        easeFactor: card.easeFactor,
        reviewCount: card.scheduledReviewCount,
        lapseCount: card.lapseCount,
        masteryScore,
        rating,
        memoryStability: card.memoryStability,
        memoryDifficulty: card.memoryDifficulty,
        targetRetention: card.targetRetention,
      });
      await tx.flashcard.update({ where: { id: card.id }, data: schedule });

      return { mastery, schedule };
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("study/review error:", error);
    return res.status(500).json({ error: "Failed to record review" });
  }
}
