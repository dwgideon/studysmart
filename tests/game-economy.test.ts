import assert from "node:assert/strict";
import test from "node:test";
import { AVATAR_CATALOG, STARTER_ITEMS, catalogItem, levelForXp, rewardForQuestion } from "../src/lib/gameEconomy.ts";

test("correct answers award difficulty-scaled XP and Sparks", () => {
  assert.deepEqual(rewardForQuestion(true, 1, true), { xp: 6, sparks: 5 });
  assert.deepEqual(rewardForQuestion(true, 3, true), { xp: 10, sparks: 9 });
});

test("wrong answers and practice-only rounds never award currency", () => {
  assert.deepEqual(rewardForQuestion(false, 3, true), { xp: 0, sparks: 0 });
  assert.deepEqual(rewardForQuestion(true, 3, false), { xp: 0, sparks: 0 });
});

test("reward difficulty is clamped to stop client reward inflation", () => {
  assert.deepEqual(rewardForQuestion(true, 99, true), { xp: 10, sparks: 9 });
  assert.deepEqual(rewardForQuestion(true, -4, true), { xp: 6, sparks: 5 });
});

test("avatar catalog has unique items and every starter item is free", () => {
  assert.equal(new Set(AVATAR_CATALOG.map((item) => item.id)).size, AVATAR_CATALOG.length);
  for (const starterId of STARTER_ITEMS) {
    assert.equal(catalogItem(starterId)?.price, 0);
  }
});

test("levels advance every 100 XP", () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(264), 3);
});
