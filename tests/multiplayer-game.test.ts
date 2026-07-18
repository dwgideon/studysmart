import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMultiplayerQuestions,
  friendlyPlayerAlias,
  isMultiplayerCode,
  multiplayerScore,
  normalizeMultiplayerCode,
  publicMultiplayerQuestion,
} from "../src/lib/multiplayerGame.ts";

test("multiplayer room codes are normalized and ambiguous characters are rejected", () => {
  assert.equal(normalizeMultiplayerCode(" ab-cd23 "), "ABCD23");
  assert.equal(isMultiplayerCode("ABCD23"), true);
  assert.equal(isMultiplayerCode("ROOM01"), false);
  assert.equal(isMultiplayerCode("SHORT"), false);
});

test("player aliases are friendly, unique for a 30-player room, and contain no user input", () => {
  const aliases = Array.from({ length: 30 }, (_, index) => friendlyPlayerAlias(index));
  assert.equal(new Set(aliases).size, 30);
  assert.equal(aliases[0], "Blue Fox");
  assert.equal(aliases[29], "Indigo Tiger");
});

test("shared questions hide answers until the host reveals the round", () => {
  const cards = [
    { id: "1", question: "One?", answer: "Alpha" },
    { id: "2", question: "Two?", answer: "Beta" },
    { id: "3", question: "Three?", answer: "Gamma" },
    { id: "4", question: "Four?", answer: "Delta" },
  ];
  const questions = buildMultiplayerQuestions(cards, () => 0.5);
  assert.equal(questions.length, 4);
  const hidden = publicMultiplayerQuestion(questions[0], false);
  assert.equal("cardId" in hidden, false);
  assert.equal("correctIndex" in hidden, false);
  assert.equal("correctAnswer" in hidden, false);
  const revealed = publicMultiplayerQuestion(questions[0], true);
  assert.equal(revealed.correctAnswer, "Alpha");
});

test("multiplayer scoring rewards correctness and bounded response speed", () => {
  const start = new Date("2026-07-17T12:00:00.000Z");
  const end = new Date("2026-07-17T12:00:30.000Z");
  assert.equal(multiplayerScore(false, 100, start, end, start), 0);
  assert.equal(multiplayerScore(true, 100, start, end, start), 150);
  assert.equal(multiplayerScore(true, 100, start, end, end), 100);
});
