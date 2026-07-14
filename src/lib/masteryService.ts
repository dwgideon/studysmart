import type { Prisma } from "@prisma/client";
import { applyMasteryReview, masteryStatus, type LearningEvidence } from "@/lib/mastery";

type EvidenceRecord = LearningEvidence & {
  userId: string;
  conceptId: string;
  sourceType: string;
  sourceId?: string | null;
};

export async function recordMasteryEvidence(
  tx: Prisma.TransactionClient,
  evidence: EvidenceRecord
) {
  const current = await tx.conceptMastery.findUnique({
    where: {
      userId_conceptId: {
        userId: evidence.userId,
        conceptId: evidence.conceptId,
      },
    },
  });
  const probabilityBefore = current?.score ?? 0.2;
  const next = applyMasteryReview({
    score: current?.score ?? 0,
    confidence: current?.confidence ?? 0,
    status: masteryStatus(current?.score ?? 0, current?.attempts ?? 0),
    attempts: current?.attempts ?? 0,
    correctCount: current?.correctCount ?? 0,
    incorrectCount: current?.incorrectCount ?? 0,
    uncertainty: current?.uncertainty ?? 1,
    memoryStability: current?.memoryStability ?? 1,
    memoryDifficulty: current?.memoryDifficulty ?? 5,
    guessRate: current?.guessRate ?? 0.2,
    slipRate: current?.slipRate ?? 0.1,
    learningRate: current?.learningRate ?? 0.15,
    forgettingRate: current?.forgettingRate ?? 0.04,
    lastEvidenceAt: current?.lastEvidenceAt,
  }, evidence);
  const mastery = await tx.conceptMastery.upsert({
    where: {
      userId_conceptId: {
        userId: evidence.userId,
        conceptId: evidence.conceptId,
      },
    },
    create: {
      userId: evidence.userId,
      conceptId: evidence.conceptId,
      ...next,
      lastPracticedAt: next.lastEvidenceAt,
    },
    update: { ...next, lastPracticedAt: next.lastEvidenceAt },
  });
  await tx.masteryEvidence.create({
    data: {
      userId: evidence.userId,
      conceptId: evidence.conceptId,
      sourceType: evidence.sourceType,
      sourceId: evidence.sourceId ?? null,
      correct: evidence.correct,
      difficulty: evidence.difficulty ?? 0.5,
      responseTimeMs: evidence.responseTimeMs ?? null,
      hintCount: evidence.hintCount ?? 0,
      independent: evidence.independent ?? true,
      probabilityBefore,
      probabilityAfter: next.score,
    },
  });
  return mastery;
}
