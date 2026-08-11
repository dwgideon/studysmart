import assert from "node:assert/strict";
import test from "node:test";
import { isUsableQuizQuestion, quizQualityReport, shuffleQuizOptions, shuffleQuizQuestions } from "../src/lib/quizQuality.ts";

test("quiz option randomization preserves the correct answer mapping", () => {
  const question = {
    question: "Which process produces oxygen?",
    options: { A: "Photosynthesis", B: "Fermentation", C: "Glycolysis", D: "Respiration" },
    answer: "A",
  };

  const shuffled = shuffleQuizOptions(question) as { options: Record<string, string>; answer: string };
  assert.equal(shuffled.options[shuffled.answer], "Photosynthesis");
  assert.deepEqual(Object.values(shuffled.options).sort(), Object.values(question.options).sort());
});

test("quiz quality gate rejects duplicate or incomplete options", () => {
  assert.equal(isUsableQuizQuestion({
    question: "Which process produces oxygen?",
    options: { A: "Photosynthesis", B: "Photosynthesis", C: "Glycolysis", D: "Respiration" },
    answer: "A",
  }), false);
  assert.equal(isUsableQuizQuestion({
    question: "Which process produces oxygen?",
    options: { A: "Photosynthesis", B: "Fermentation", C: "Glycolysis", D: "Respiration" },
    answer: "A",
  }), true);
  assert.equal(shuffleQuizQuestions([{ question: "short", options: {}, answer: "A" }]).length, 0);
});

test("quiz quality gate catches answer clues and weak distractors", () => {
  const report = quizQualityReport({
    question: "Which process is cellular respiration?",
    options: {
      A: "Cellular respiration",
      B: "The process plants use to convert light into stored chemical energy",
      C: "Diffusion",
      D: "Osmosis",
    },
    answer: "A",
    explanation: "Cells release usable energy through this process.",
    concept: "cellular respiration",
  });
  assert.equal(report.valid, false);
  assert.ok(report.issues.includes("option_length_clue"));
  assert.ok(report.issues.includes("answer_repeated_in_prompt"));
});

test("quiz generation removes exact duplicate prompts after quality checks", () => {
  const question = {
    question: "What is a habitat?",
    options: { A: "A place where an organism lives", B: "A type of weather", C: "A food chain", D: "A body part" },
    answer: "A",
  };
  assert.equal(shuffleQuizQuestions([question, question]).length, 1);
});
