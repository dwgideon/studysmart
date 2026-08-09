import assert from "node:assert/strict";
import test from "node:test";
import { isUsableQuizQuestion, shuffleQuizOptions, shuffleQuizQuestions } from "../src/lib/quizQuality.ts";

test("quiz option randomization preserves the correct answer mapping", () => {
  const question = {
    question: "Which process produces oxygen?",
    options: { A: "Photosynthesis", B: "Fermentation", C: "Glycolysis", D: "Respiration" },
    answer: "A",
  };

  const shuffled = shuffleQuizOptions(question) as typeof question;
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
