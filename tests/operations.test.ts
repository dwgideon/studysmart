import assert from "node:assert/strict";
import test from "node:test";
import {
  sanitizeOperationalMetadata,
  secureBearerMatches,
} from "../src/lib/operations.ts";

test("operational metadata removes secrets, child content, and log injection", () => {
  assert.deepEqual(sanitizeOperationalMetadata({
    route: "api.tutor\nforged-event",
    authorization: "Bearer secret",
    prompt: "private learner prompt",
    nested: { email: "child@example.test", status: 503 },
  }), {
    route: "api.tutor forged-event",
    authorization: "[redacted]",
    prompt: "[redacted]",
    nested: { email: "[redacted]", status: 503 },
  });
});

test("operations bearer comparison fails closed", () => {
  assert.equal(secureBearerMatches(undefined, "expected"), false);
  assert.equal(secureBearerMatches("Bearer wrong", "expected"), false);
  assert.equal(secureBearerMatches("Basic expected", "expected"), false);
  assert.equal(secureBearerMatches("Bearer expected", "expected"), true);
});
