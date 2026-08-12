import assert from "node:assert/strict";
import test from "node:test";
import { allLessons } from "../src/lib/curriculumSchema.ts";
import { canPublishLesson, evaluateLessonQuality, nextEditorialStatus } from "../src/lib/curriculumQuality.ts";
import { PILOT_UNITS, getPilotLesson } from "../src/lib/pilotCurriculum.ts";

test("pilot curriculum has three complete quality-standard units", () => {
  assert.deepEqual(PILOT_UNITS.map((unit) => unit.id), ["pilot-kindergarten-phonics", "pilot-grade4-fractions", "pilot-grade6-ecosystems"]);
  assert.deepEqual(PILOT_UNITS.map((unit) => unit.lessons.length), [12, 10, 10]);
  assert.equal(allLessons(PILOT_UNITS).length, 32);
  assert.equal(new Set(allLessons(PILOT_UNITS).map((lesson) => lesson.id)).size, 32);
});

test("every pilot lesson passes the publishing quality gate", () => {
  for (const lesson of allLessons(PILOT_UNITS)) {
    const report = evaluateLessonQuality(lesson);
    assert.equal(report.passed, true, `${lesson.id}: ${report.checks.filter((check) => !check.passed).map((check) => check.id).join(", ")}`);
    assert.equal(lesson.status, "PUBLISHED");
    assert.equal(lesson.source.reviewedBy, "StudySmart Curriculum Review Board");
    assert.ok(lesson.guidedPractice.length >= 2);
    assert.ok(lesson.independentPractice.length >= 2);
    assert.ok(lesson.quizQuestions.length >= 3);
    assert.ok(lesson.flashcards.length >= 2);
  }
});

test("editorial workflow requires the right review role at every gate", () => {
  assert.equal(nextEditorialStatus("DRAFT", "AUTHOR"), "EDITOR_REVIEW");
  assert.equal(nextEditorialStatus("EDITOR_REVIEW", "EDUCATOR"), "ACCESSIBILITY_REVIEW");
  assert.equal(nextEditorialStatus("ACCESSIBILITY_REVIEW", "ACCESSIBILITY"), "SAFETY_REVIEW");
  assert.equal(nextEditorialStatus("SAFETY_REVIEW", "SAFETY"), "PUBLISHED");
  assert.equal(nextEditorialStatus("DRAFT", "SAFETY"), null);
  const lesson = getPilotLesson("pilot-grade4-fractions-lesson-1");
  assert.ok(lesson);
  assert.equal(canPublishLesson({ ...lesson, status: "SAFETY_REVIEW" }), true);
});
