type ScheduleInput = {
  correct: boolean;
  rating?: 1 | 2 | 3 | 4;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lapseCount: number;
  masteryScore: number;
  memoryStability?: number;
  memoryDifficulty?: number;
  targetRetention?: number;
  now?: Date;
};

type ScheduleResult = {
  nextReviewAt: Date;
  lastReviewedAt: Date;
  intervalDays: number;
  easeFactor: number;
  scheduledReviewCount: number;
  lapseCount: number;
  memoryStability: number;
  memoryDifficulty: number;
  targetRetention: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Number(value.toFixed(3));
}

export function predictedRetention(intervalDays: number, stability: number) {
  const safeStability = clamp(stability || 1, 0.1, 3650);
  return clamp((1 + Math.max(0, intervalDays) / (9 * safeStability)) ** -1, 0, 1);
}

export function scheduleNextReview(input: ScheduleInput): ScheduleResult {
  const now = input.now ?? new Date();
  const rating = input.rating ?? (input.correct ? 3 : 1);
  const correct = rating >= 2 && input.correct;
  const scheduledReviewCount = input.reviewCount + 1;
  const targetRetention = clamp(input.targetRetention ?? 0.9, 0.75, 0.97);
  let stability = clamp(input.memoryStability ?? Math.max(0.5, input.intervalDays), 0.1, 3650);
  let difficulty = clamp(input.memoryDifficulty ?? 5, 1, 10);
  let lapseCount = input.lapseCount;

  if (!correct) {
    lapseCount += 1;
    stability = clamp(stability * (0.35 + 0.12 * input.masteryScore), 0.1, 3650);
    difficulty = clamp(difficulty + 0.8, 1, 10);
  } else {
    const retrievability = predictedRetention(Math.max(0, input.intervalDays), stability);
    const ratingFactor = rating === 4 ? 1.35 : rating === 2 ? 0.7 : 1;
    const growth = 1 +
      ratingFactor *
      (0.35 + (1 - retrievability) * 1.8) *
      (1 + (10 - difficulty) * 0.04) *
      (0.8 + clamp(input.masteryScore, 0, 1) * 0.35);
    stability = clamp(stability * growth, 0.1, 3650);
    difficulty = clamp(
      difficulty + (rating === 4 ? -0.35 : rating === 2 ? 0.25 : -0.12),
      1,
      10
    );
  }

  let intervalDays = correct
    ? 9 * stability * (1 / targetRetention - 1)
    : rating === 1
      ? 0.1
      : 0.5;
  if (input.reviewCount === 0 && correct) {
    intervalDays = rating === 4 ? 3 : rating === 2 ? 0.5 : 1;
  }
  intervalDays = clamp(intervalDays, 0.1, 365);
  const easeFactor = clamp(3.2 - difficulty * 0.14, 1.3, 3);

  return {
    nextReviewAt: new Date(now.getTime() + intervalDays * 86_400_000),
    lastReviewedAt: now,
    intervalDays: round(intervalDays),
    easeFactor: round(easeFactor),
    scheduledReviewCount,
    lapseCount,
    memoryStability: round(stability),
    memoryDifficulty: round(difficulty),
    targetRetention: round(targetRetention),
  };
}
