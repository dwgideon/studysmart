import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_FREE_SAMPLE_LESSON,
  generateLocalFlashcards,
  generateLocalQuiz,
  localGroundedTutorReply,
} from "../src/lib/aiFreeTestMode.ts";

test("AI-free flashcards are deterministic and usable by games", () => {
  const first = generateLocalFlashcards(AI_FREE_SAMPLE_LESSON, 8);
  const second = generateLocalFlashcards(AI_FREE_SAMPLE_LESSON, 8);
  assert.deepEqual(first, second);
  assert.ok(first.length >= 4);
  assert.ok(first.every((card) => card.front && card.back && card.concept));
});

test("AI-free mode scales to the material instead of stopping at eight cards", () => {
  const deepMaterial = Array.from({ length: 24 }, (_, index) =>
    `Concept ${index + 1} is an important study fact with a distinct definition and example.`
  ).join("\n");
  const cards = generateLocalFlashcards(deepMaterial);
  const questions = generateLocalQuiz(deepMaterial);
  assert.equal(cards.length, 24);
  assert.equal(questions.length, 24);
});

test("AI-free quiz questions contain one correctly keyed answer", () => {
  const questions = generateLocalQuiz(AI_FREE_SAMPLE_LESSON, 6);
  assert.equal(questions.length, 6);
  for (const question of questions) {
    assert.ok(["A", "B", "C", "D"].includes(question.answer));
    assert.ok(question.options[question.answer]);
    assert.match(question.explanation, /study material states/i);
  }
});

test("AI-free grounded tutor cites retrieved material", () => {
  const reply = localGroundedTutorReply({
    question: "What is evaporation?",
    sourceMode: "materials",
    chunks: [{ label: "S1", content: "Evaporation changes liquid water into water vapor." }],
  });
  assert.match(reply, /\[S1\]/);
  assert.match(reply, /Evaporation/);
});

test("AI-free general tutor discloses that generation is disabled", () => {
  const reply = localGroundedTutorReply({ question: "Explain gravity", sourceMode: "general", chunks: [] });
  assert.match(reply, /no paid AI request was made/i);
});
