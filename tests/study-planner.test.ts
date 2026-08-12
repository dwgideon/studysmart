import assert from "node:assert/strict";
import test from "node:test";
import { buildStudyPlan } from "../src/lib/studyPlanner.ts";

const now = new Date("2026-08-11T00:00:00.000Z");

test("blended study plan aligns uploaded material to K–8 curriculum and creates a connected sequence", () => {
  const plan = buildStudyPlan({
    grade: "4",
    subject: "Math",
    courseName: "Math 4",
    examDate: new Date("2026-08-20T00:00:00.000Z"),
    materialTitles: ["Unit 3 Fractions Review"],
    materialConcepts: ["fractions equivalent fractions number line compare fractions"],
    now,
    mode: "BLENDED",
  });

  assert.equal(plan.coverage, "BLENDED");
  assert.equal(plan.daysRemaining, 9);
  assert.ok(plan.matchedOriginals.some((set) => set.topic.includes("Fractions")));
  assert.equal(plan.nextBestAction.kind, "LEARN");
  assert.ok(plan.actions.some((action) => action.kind === "PRACTICE"));
  assert.ok(plan.actions.some((action) => action.kind === "TUTOR"));
  assert.ok(plan.actions.some((action) => action.kind === "RETRIEVE"));
  assert.ok(plan.actions.some((action) => action.kind === "GAME"));
});

test("material-first without aligned catalog content stays honest and asks for material", () => {
  const plan = buildStudyPlan({
    grade: "7",
    subject: "Biology",
    courseName: "Biology",
    materialTitles: ["Teacher packet"],
    materialConcepts: ["mitosis meiosis chromosome cell division"],
    now,
    mode: "MATERIAL_FIRST",
  });

  assert.equal(plan.coverage, "MATERIAL_ONLY");
  assert.equal(plan.matchedOriginals.length, 0);
  assert.equal(plan.materialCount, 1);
  assert.ok(plan.actions.some((action) => action.kind === "RETRIEVE"));
});

test("curriculum-first with no uploads starts with an upload recommendation and original units", () => {
  const plan = buildStudyPlan({
    grade: "K",
    subject: "Reading",
    courseName: "Kindergarten Reading",
    materialTitles: [],
    materialConcepts: [],
    now,
    mode: "CURRICULUM_FIRST",
  });

  assert.equal(plan.coverage, "CURRICULUM_STARTER");
  assert.ok(plan.matchedOriginals.length > 0);
  assert.equal(plan.nextBestAction.kind, "UPLOAD");
  assert.ok(plan.actions[1].href.startsWith("/library"));
});
