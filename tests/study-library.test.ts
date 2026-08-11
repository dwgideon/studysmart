import assert from "node:assert/strict";
import test from "node:test";
import {
  K8_GRADES,
  LIBRARY_SUBJECTS,
  STUDYSMART_ORIGINALS,
  getOriginalLibraryStats,
  listOriginalSets,
} from "../src/lib/studyLibrary.ts";

test("StudySmart Originals cover every K–8 grade and core subject lane", () => {
  const stats = getOriginalLibraryStats();
  assert.equal(stats.grades, 9);
  assert.equal(stats.subjects, 6);
  assert.equal(stats.totalSets, 216);
  for (const grade of K8_GRADES) {
    assert.equal(listOriginalSets({ grade }).length, 24, `expected 24 sets for ${grade}`);
  }
  for (const subject of LIBRARY_SUBJECTS) {
    assert.equal(listOriginalSets({ subject }).length, 36, `expected 36 sets for ${subject}`);
  }
});

test("original library metadata is source-attributed and practice-ready", () => {
  const ids = new Set<string>();
  for (const set of STUDYSMART_ORIGINALS) {
    assert.equal(ids.has(set.id), false, `duplicate set id ${set.id}`);
    ids.add(set.id);
    assert.equal(set.source.label, "StudySmart Originals");
    assert.equal(set.source.kind, "ORIGINAL");
    assert.match(set.source.license, /educator-reviewed/);
    assert.ok(set.learningGoals.length >= 3);
    assert.ok(set.standards.length >= 1);
    assert.ok(set.prerequisites.length >= 1);
    assert.ok(set.skillTags.length >= 3);
    assert.ok(set.flashcardCount >= 8);
    assert.ok(set.questionCount >= 6);
    assert.equal(set.readAloud, true);
  }
});

test("library search finds concepts and skills without exposing unrelated grades", () => {
  const fractionSets = listOriginalSets({ grade: "5", search: "fractions" });
  assert.ok(fractionSets.length > 0);
  assert.ok(fractionSets.every((set) => set.grade === "5"));
  assert.ok(fractionSets.every((set) => `${set.title} ${set.summary} ${set.skillTags.join(" ")}`.toLocaleLowerCase().includes("fraction")));
  assert.equal(listOriginalSets({ subject: "Science", search: "counterclaim" }).length, 0);
});
