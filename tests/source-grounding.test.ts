import test from "node:test";
import assert from "node:assert/strict";
import { splitSourceSegment } from "../src/lib/sourceChunking.ts";
import { removeInvalidCitationLabels, validateCitationLabels } from "../src/lib/sourceAttribution.ts";

test("source chunking preserves page and character locators", () => {
  const text = `${"Photosynthesis converts light energy into chemical energy. ".repeat(40)}\n\n${"Cellular respiration releases stored energy. ".repeat(40)}`;
  const chunks = splitSourceSegment({
    text,
    page: 7,
    section: "Energy in cells",
  }, 0);
  assert.ok(chunks.length > 1);
  assert.equal(chunks[0].locator.page, 7);
  assert.equal(chunks[0].locator.section, "Energy in cells");
  assert.equal(chunks[0].locator.characterStart, 0);
  assert.ok(chunks.every((chunk) => chunk.contentHash.length === 64));
});

test("source chunks overlap so answers near boundaries retain context", () => {
  const text = "A".repeat(4_000);
  const chunks = splitSourceSegment({ text, section: "Long notes" }, 0);
  assert.ok(chunks.length >= 3);
  assert.ok(Number(chunks[1].locator.characterStart) < Number(chunks[0].locator.characterEnd));
});

test("source attribution fails closed when a tutor cites an unavailable chunk", () => {
  const validation = validateCitationLabels("The answer is supported [S1] but not [S9].", ["S1", "S2"]);
  assert.deepEqual(validation.validLabels, ["S1"]);
  assert.deepEqual(validation.invalidLabels, ["S9"]);
  assert.equal(validation.status, "INVALID");
  assert.equal(removeInvalidCitationLabels("See [S1] and [S9].", ["S1"]), "See [S1] and (source not verified).");
});

test("source attribution marks a response without citations as missing", () => {
  assert.equal(validateCitationLabels("This is an answer.", ["S1"]).status, "MISSING");
});
