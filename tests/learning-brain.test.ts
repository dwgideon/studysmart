import test from "node:test";
import assert from "node:assert/strict";
import {
  applyMasteryReview,
  decayedMastery,
  expectedLearningPriority,
  type MasterySnapshot,
} from "../src/lib/mastery.ts";
import { predictedRetention, scheduleNextReview } from "../src/lib/spacedRepetition.ts";

const snapshot: MasterySnapshot = {
  score: 0.5,
  confidence: 0.3,
  status: "LEARNING",
  attempts: 3,
  correctCount: 2,
  incorrectCount: 1,
  uncertainty: 0.7,
  memoryStability: 2,
  memoryDifficulty: 5,
  guessRate: 0.2,
  slipRate: 0.1,
  learningRate: 0.15,
  forgettingRate: 0.04,
  lastEvidenceAt: new Date("2026-07-10T00:00:00.000Z"),
};

test("independent correct evidence raises mastery and records a review date", () => {
  const next = applyMasteryReview(snapshot, {
    correct: true,
    difficulty: 0.7,
    independent: true,
    now: new Date("2026-07-10T00:00:00.000Z"),
  });
  assert.ok(next.score > snapshot.score);
  assert.equal(next.attempts, 4);
  assert.ok(next.nextReviewAt > next.lastEvidenceAt);
});

test("hints reduce the strength of positive evidence", () => {
  const independent = applyMasteryReview(snapshot, { correct: true, hintCount: 0 });
  const assisted = applyMasteryReview(snapshot, { correct: true, hintCount: 3 });
  assert.ok(independent.score > assisted.score);
});

test("incorrect evidence lowers mastery and long gaps decay mastery", () => {
  const incorrect = applyMasteryReview(snapshot, { correct: false });
  assert.ok(incorrect.score < snapshot.score);
  const decayed = decayedMastery(snapshot, new Date("2026-08-10T00:00:00.000Z"));
  assert.ok(decayed < snapshot.score);
});

test("priority increases for weak, uncertain, overdue concepts", () => {
  const high = expectedLearningPriority({
    score: 0.2,
    uncertainty: 0.9,
    prerequisiteGap: 0.8,
    nextReviewAt: new Date("2026-07-01T00:00:00.000Z"),
  }, new Date("2026-07-14T00:00:00.000Z"));
  const low = expectedLearningPriority({ score: 0.9, uncertainty: 0.1 });
  assert.ok(high > low);
});

test("memory scheduler gives failures a short retry and easy recalls more stability", () => {
  const common = {
    intervalDays: 3,
    easeFactor: 2.5,
    reviewCount: 3,
    lapseCount: 0,
    masteryScore: 0.7,
    memoryStability: 3,
    memoryDifficulty: 5,
    targetRetention: 0.9,
    now: new Date("2026-07-14T00:00:00.000Z"),
  };
  const failed = scheduleNextReview({ ...common, correct: false, rating: 1 });
  const good = scheduleNextReview({ ...common, correct: true, rating: 3 });
  const easy = scheduleNextReview({ ...common, correct: true, rating: 4 });
  assert.ok(failed.intervalDays < good.intervalDays);
  assert.ok(easy.memoryStability > good.memoryStability);
  assert.ok(predictedRetention(0, 2) > predictedRetention(10, 2));
});
