import assert from "node:assert/strict";
import test from "node:test";
import { LEARNING_COMPANIONS, companionById, companionGreeting } from "../src/lib/learningCompanions.ts";

test("learning companions have unique persistent identifiers", () => {
  assert.equal(new Set(LEARNING_COMPANIONS.map((companion) => companion.id)).size, LEARNING_COMPANIONS.length);
  assert.ok(LEARNING_COMPANIONS.filter((companion) => companion.elementary).length >= 4);
  assert.ok(LEARNING_COMPANIONS.filter((companion) => !companion.elementary).length >= 2);
});

test("early-reader greeting explicitly explains spoken and visible words", () => {
  const nova = companionById("nova_fox");
  assert.ok(nova);
  const greeting = companionGreeting(nova, "Sam", true);
  assert.match(greeting, /speaker/i);
  assert.match(greeting, /read the words/i);
  assert.match(greeting, /Sam/);
});

test("unknown companion identifiers cannot resolve", () => {
  assert.equal(companionById("not_a_real_companion"), undefined);
});
