import test from "node:test";
import assert from "node:assert/strict";
import {
  effectiveRetentionDays,
  retentionCutoff,
} from "../src/lib/dataRetentionPolicy.ts";

test("district retention is a ceiling and cannot weaken a learner choice", () => {
  assert.equal(effectiveRetentionDays(30, 365), 30);
  assert.equal(effectiveRetentionDays(365, 90), 90);
  assert.equal(effectiveRetentionDays(365, null), 365);
});

test("retention cutoff is deterministic in UTC milliseconds", () => {
  const now = new Date("2026-07-14T12:00:00.000Z");
  assert.equal(
    retentionCutoff(now, 365, 30).toISOString(),
    "2026-06-14T12:00:00.000Z"
  );
});
