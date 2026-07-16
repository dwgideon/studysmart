import assert from "node:assert/strict";
import test from "node:test";
import { protectedAgeGroupForGrade } from "../src/lib/learningProfile.ts";
import { isTrustedMutationRequest } from "../src/lib/requestSecurity.ts";

test("grade and prior child status prevent age-protection bypasses", () => {
  assert.equal(protectedAgeGroupForGrade({ gradeLevel: "K", requestedAgeGroup: "ADULT" }), "UNDER_13");
  assert.equal(protectedAgeGroupForGrade({ gradeLevel: "5", requestedAgeGroup: "TEEN" }), "UNDER_13");
  assert.equal(protectedAgeGroupForGrade({ gradeLevel: "9", requestedAgeGroup: "ADULT" }), "TEEN");
  assert.equal(protectedAgeGroupForGrade({
    gradeLevel: "12",
    requestedAgeGroup: "TEEN",
    existingAgeGroup: "UNDER_13",
  }), "UNDER_13");
  assert.equal(protectedAgeGroupForGrade({
    gradeLevel: "12",
    requestedAgeGroup: "ADULT",
    accountRole: "TEACHER",
  }), "ADULT");
});

test("cross-site browser mutations are rejected without blocking server clients", () => {
  const base = { host: "studysmart.example" };
  assert.equal(isTrustedMutationRequest({ method: "GET", headers: { ...base, "sec-fetch-site": "cross-site" } }), true);
  assert.equal(isTrustedMutationRequest({ method: "POST", headers: { ...base, "sec-fetch-site": "cross-site" } }), false);
  assert.equal(isTrustedMutationRequest({ method: "POST", headers: { ...base, origin: "https://studysmart.example" } }), true);
  assert.equal(isTrustedMutationRequest({ method: "POST", headers: { ...base, origin: "https://attacker.example" } }), false);
  assert.equal(isTrustedMutationRequest({ method: "POST", headers: base }), true);
});
