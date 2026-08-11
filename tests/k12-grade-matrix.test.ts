import assert from "node:assert/strict";
import test from "node:test";
import {
  GRADE_LEVELS,
  experienceForGrade,
  gradeBandFor,
  tutorPromptForGrade,
  type GradeBand,
} from "../src/lib/learningProfile.ts";
import {
  chooseNextQuestion,
  fallbackDiagnostic,
  publicQuestion,
  updateAbilityEstimate,
} from "../src/lib/diagnostic.ts";

const EXPECTED_BANDS: Record<string, GradeBand> = {
  K: "EARLY",
  "1": "EARLY",
  "2": "EARLY",
  "3": "ELEMENTARY",
  "4": "ELEMENTARY",
  "5": "ELEMENTARY",
  "6": "MIDDLE",
  "7": "MIDDLE",
  "8": "MIDDLE",
  "9": "HIGH",
  "10": "HIGH",
  "11": "HIGH",
  "12": "HIGH",
};

test("every K–12 grade resolves to its intended experience and tutor style", () => {
  assert.equal(GRADE_LEVELS.length, 13);
  for (const grade of GRADE_LEVELS) {
    const band = gradeBandFor(grade.value);
    assert.equal(band, EXPECTED_BANDS[grade.value], `${grade.label} band`);
    const prompt = tutorPromptForGrade(grade.value);
    assert.ok(prompt.length >= 70, `${grade.label} has a substantive tutor prompt`);
    assert.match(prompt, /Teach a|learner/i);
  }
});

test("every grade receives six valid, unique readiness skills", () => {
  for (const grade of GRADE_LEVELS) {
    const questions = fallbackDiagnostic(grade.value);
    assert.equal(questions.length, 6, `${grade.label} question count`);
    assert.equal(new Set(questions.map((question) => question.concept)).size, 6);
    assert.equal(new Set(questions.map((question) => question.id)).size, 6);

    for (const question of questions) {
      assert.ok(question.prompt.length > 5, `${grade.label}: ${question.concept} prompt`);
      assert.deepEqual(Object.keys(question.options), ["A", "B", "C", "D"]);
      assert.ok(question.options[question.answer], `${grade.label}: keyed answer exists`);
      assert.ok(question.difficulty >= 1 && question.difficulty <= 5);
      assert.ok(question.discrimination >= 0.5 && question.discrimination <= 2);
      assert.ok(question.guessing >= 0.05 && question.guessing <= 0.35);
      assert.equal("answer" in publicQuestion(question), false, "answers stay server-only");
    }
  }
});

test("K–8 experience config changes interaction style by age band", () => {
  const early = experienceForGrade("K");
  const elementary = experienceForGrade("4");
  const middle = experienceForGrade("8");

  assert.equal(early.readAloud, "REQUIRED");
  assert.equal(early.visualSupport, "PRIMARY");
  assert.ok(early.responseModes.includes("oral-response"));
  assert.equal(elementary.readAloud, "PREFERRED");
  assert.ok(elementary.responseModes.includes("match-and-sort"));
  assert.equal(middle.readAloud, "OPTIONAL");
  assert.ok(middle.responseModes.includes("evidence-check"));
  assert.notEqual(early.tutorWordLimit, middle.tutorWordLimit);
});

test("adaptive diagnostics can complete all skills for every grade", () => {
  for (const grade of GRADE_LEVELS) {
    const questions = fallbackDiagnostic(grade.value);
    const responses: Array<{
      questionId: string;
      answer: string;
      correct: boolean;
      concept: string;
      difficulty: number;
    }> = [];
    let ability = 0.5;

    while (responses.length < questions.length) {
      const question = chooseNextQuestion(questions, responses, ability);
      assert.ok(question, `${grade.label} has a next diagnostic skill`);
      ability = updateAbilityEstimate(ability, true, question);
      responses.push({
        questionId: question.id,
        answer: question.answer,
        correct: true,
        concept: question.concept,
        difficulty: question.difficulty,
      });
    }

    assert.equal(chooseNextQuestion(questions, responses, ability), null);
    assert.equal(new Set(responses.map((response) => response.concept)).size, 6);
    assert.ok(ability > 0.5, `${grade.label} ability rises after correct evidence`);
  }
});
