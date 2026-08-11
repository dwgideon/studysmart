import {
  decayedMastery,
  expectedLearningPriority,
  masteryStatus,
  type MasterySnapshot,
} from "./mastery.ts";
import { predictedRetention } from "./spacedRepetition.ts";

type MasteryInsightInput = {
  mastery: MasterySnapshot & { nextReviewAt?: Date | null };
  prerequisiteGap?: number;
  examUrgency?: number;
};

type MasteryInsight = {
  score: number;
  confidence: number;
  status: ReturnType<typeof masteryStatus>;
  due: boolean;
  predictedRetention: number;
  priority: number;
  prerequisiteGap: number;
  recommendedMode:
    | "PREREQUISITE_REPAIR"
    | "CALIBRATION_CHECK"
    | "RETRIEVAL_REVIEW"
    | "GUIDED_PRACTICE";
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Number(value.toFixed(4));
}

/**
 * Builds the learner-facing state for a concept from its evidence record.
 * This keeps dashboard, next-step, and future mobile clients on one model.
 */
export function buildMasteryInsight(
  input: MasteryInsightInput,
  now = new Date(),
): MasteryInsight {
  const mastery = input.mastery;
  const score = decayedMastery(mastery, now);
  const uncertainty = clamp(mastery.uncertainty ?? 1);
  const nextReviewAt = mastery.nextReviewAt ?? null;
  const due = Boolean(nextReviewAt && nextReviewAt <= now);
  const elapsedDays = mastery.lastEvidenceAt
    ? Math.max(0, (now.getTime() - mastery.lastEvidenceAt.getTime()) / 86_400_000)
    : 0;
  const retention = predictedRetention(
    elapsedDays,
    mastery.memoryStability ?? 1,
  );
  const prerequisiteGap = clamp(input.prerequisiteGap ?? 0);
  const priority = expectedLearningPriority({
    score,
    uncertainty,
    nextReviewAt,
    prerequisiteGap,
    examUrgency: input.examUrgency,
  }, now);
  const recommendedMode = prerequisiteGap > 0.45
    ? "PREREQUISITE_REPAIR"
    : uncertainty > 0.62
      ? "CALIBRATION_CHECK"
      : due
        ? "RETRIEVAL_REVIEW"
        : "GUIDED_PRACTICE";

  return {
    score: round(score),
    confidence: round(1 - uncertainty),
    status: masteryStatus(score, mastery.attempts),
    due,
    predictedRetention: round(retention),
    priority,
    prerequisiteGap: round(prerequisiteGap),
    recommendedMode,
  };
}
