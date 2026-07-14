export type MasteryStatus = "NEW" | "LEARNING" | "DEVELOPING" | "MASTERED";

export type MasterySnapshot = {
  score: number;
  confidence: number;
  status: MasteryStatus;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  uncertainty?: number;
  memoryStability?: number;
  memoryDifficulty?: number;
  guessRate?: number;
  slipRate?: number;
  learningRate?: number;
  forgettingRate?: number;
  lastEvidenceAt?: Date | null;
};

export type LearningEvidence = {
  correct: boolean;
  difficulty?: number;
  responseTimeMs?: number | null;
  hintCount?: number;
  independent?: boolean;
  now?: Date;
};

type MasteryUpdate = MasterySnapshot & {
  uncertainty: number;
  memoryStability: number;
  memoryDifficulty: number;
  guessRate: number;
  slipRate: number;
  learningRate: number;
  forgettingRate: number;
  lastEvidenceAt: Date;
  nextReviewAt: Date;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function rounded(value: number) {
  return Number(value.toFixed(4));
}

export function normalizeConceptName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 120);
}

export function masteryStatus(score: number, attempts: number): MasteryStatus {
  if (attempts === 0) {return "NEW";}
  if (score >= 0.85 && attempts >= 4) {return "MASTERED";}
  if (score >= 0.55) {return "DEVELOPING";}
  return "LEARNING";
}

export function decayedMastery(current: MasterySnapshot, now = new Date()) {
  const starting = current.attempts === 0 ? 0.2 : clamp(current.score);
  if (!current.lastEvidenceAt) {return starting;}
  const elapsedDays = Math.max(
    0,
    (now.getTime() - current.lastEvidenceAt.getTime()) / 86_400_000
  );
  const floor = 0.05;
  const forgettingRate = clamp(current.forgettingRate ?? 0.04, 0.005, 0.2);
  const stability = clamp(current.memoryStability ?? 1, 0.1, 365);
  return clamp(
    floor + (starting - floor) * Math.exp(-(forgettingRate * elapsedDays) / stability)
  );
}

export function applyMasteryReview(
  current: MasterySnapshot,
  evidenceOrCorrect: LearningEvidence | boolean
): MasteryUpdate {
  const evidence = typeof evidenceOrCorrect === "boolean"
    ? { correct: evidenceOrCorrect }
    : evidenceOrCorrect;
  const now = evidence.now ?? new Date();
  const prior = decayedMastery(current, now);
  const difficulty = clamp(evidence.difficulty ?? 0.5);
  const guessRate = clamp(current.guessRate ?? 0.2, 0.05, 0.35);
  const slipRate = clamp(current.slipRate ?? 0.1, 0.03, 0.3);
  const learningRate = clamp(current.learningRate ?? 0.15, 0.03, 0.4);
  const forgettingRate = clamp(current.forgettingRate ?? 0.04, 0.005, 0.2);
  const likelihoodKnown = evidence.correct ? 1 - slipRate : slipRate;
  const likelihoodUnknown = evidence.correct ? guessRate : 1 - guessRate;
  const denominator = prior * likelihoodKnown + (1 - prior) * likelihoodUnknown;
  const observedPosterior = denominator > 0
    ? (prior * likelihoodKnown) / denominator
    : prior;
  const hintCount = Math.max(0, Math.min(10, evidence.hintCount ?? 0));
  const reliability = (evidence.independent === false ? 0.72 : 1) /
    (1 + hintCount * 0.22);
  const evidenceAdjusted = prior + (observedPosterior - prior) * reliability;
  const transition = learningRate * (0.75 + difficulty * 0.5) *
    (evidence.correct ? 1 : 0.3);
  const score = clamp(evidenceAdjusted + (1 - evidenceAdjusted) * transition);
  const attempts = current.attempts + 1;
  const correctCount = current.correctCount + (evidence.correct ? 1 : 0);
  const incorrectCount = current.incorrectCount + (evidence.correct ? 0 : 1);
  const previousStability = clamp(current.memoryStability ?? 1, 0.1, 365);
  const memoryStability = evidence.correct
    ? clamp(
        previousStability * (1 + 0.55 * (1 - prior) * (0.75 + difficulty)),
        0.1,
        365
      )
    : clamp(previousStability * (0.45 + 0.15 * prior), 0.1, 365);
  const previousDifficulty = clamp(current.memoryDifficulty ?? 5, 1, 10);
  const memoryDifficulty = clamp(
    previousDifficulty + (evidence.correct ? -0.18 : 0.45) + (difficulty - 0.5) * 0.15,
    1,
    10
  );
  const evidenceConfidence = 1 - Math.exp(-attempts / 5);
  const probabilityEntropy = 4 * score * (1 - score);
  const uncertainty = clamp(1 - evidenceConfidence * (1 - probabilityEntropy * 0.6), 0.03, 1);
  const confidence = 1 - uncertainty;
  const targetProbability = 0.78;
  const intervalDays = score <= targetProbability
    ? 0.25
    : clamp(
        (-memoryStability / forgettingRate) *
          Math.log((targetProbability - 0.05) / Math.max(0.001, score - 0.05)),
        0.25,
        180
      );
  const nextReviewAt = new Date(now.getTime() + intervalDays * 86_400_000);

  return {
    score: rounded(score),
    confidence: rounded(confidence),
    status: masteryStatus(score, attempts),
    attempts,
    correctCount,
    incorrectCount,
    uncertainty: rounded(uncertainty),
    memoryStability: rounded(memoryStability),
    memoryDifficulty: rounded(memoryDifficulty),
    guessRate: rounded(guessRate),
    slipRate: rounded(slipRate),
    learningRate: rounded(learningRate),
    forgettingRate: rounded(forgettingRate),
    lastEvidenceAt: now,
    nextReviewAt,
  };
}

export function expectedLearningPriority(input: {
  score: number;
  uncertainty: number;
  nextReviewAt?: Date | null;
  prerequisiteGap?: number;
  examUrgency?: number;
}, now = new Date()) {
  const overdue = input.nextReviewAt && input.nextReviewAt <= now ? 1 : 0;
  return rounded(
    (1 - clamp(input.score)) * 0.4 +
    clamp(input.uncertainty) * 0.24 +
    clamp(input.prerequisiteGap ?? 0) * 0.18 +
    clamp(input.examUrgency ?? 0) * 0.1 +
    overdue * 0.08
  );
}
