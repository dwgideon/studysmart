import { gradeBandFor, type GradeBand } from "@/lib/learningProfile";

export type DiagnosticQuestion = {
  id: string;
  concept: string;
  prerequisite: string | null;
  prompt: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  answer: "A" | "B" | "C" | "D";
  difficulty: number;
  discrimination: number;
  guessing: number;
  standardCode: string | null;
  reason: string;
};

export type DiagnosticResponse = {
  questionId: string;
  answer: string;
  correct: boolean;
  concept: string;
  difficulty: number;
};

export function validateDiagnosticQuestions(value: unknown): DiagnosticQuestion[] {
  if (!value || typeof value !== "object") {return [];}
  const questions = (value as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) {return [];}

  return questions.flatMap((item, index) => {
    if (!item || typeof item !== "object") {return [];}
    const question = item as Partial<DiagnosticQuestion>;
    const options = question.options;
    const answer = question.answer;
    if (
      typeof question.prompt !== "string" ||
      typeof question.concept !== "string" ||
      !question.concept.trim() ||
      !options ||
      typeof options.A !== "string" ||
      typeof options.B !== "string" ||
      typeof options.C !== "string" ||
      typeof options.D !== "string" ||
      !["A", "B", "C", "D"].includes(String(answer))
    ) {return [];}
    return [{
      id: typeof question.id === "string" ? question.id : `q-${index + 1}`,
      concept: question.concept.trim().slice(0, 120),
      prerequisite:
        typeof question.prerequisite === "string"
          ? question.prerequisite.trim().slice(0, 120)
          : null,
      prompt: question.prompt.trim().slice(0, 600),
      options,
      answer: answer as DiagnosticQuestion["answer"],
      difficulty: Math.max(1, Math.min(5, Number(question.difficulty) || 3)),
      discrimination: Math.max(0.5, Math.min(2, Number(question.discrimination) || 1)),
      guessing: Math.max(0.05, Math.min(0.35, Number(question.guessing) || 0.2)),
      standardCode:
        typeof question.standardCode === "string"
          ? question.standardCode.trim().slice(0, 80) || null
          : null,
      reason:
        typeof question.reason === "string"
          ? question.reason.trim().slice(0, 240)
          : "Checks a skill needed for this course.",
    }];
  }).slice(0, 12);
}

export function fallbackDiagnostic(gradeLevel: string): DiagnosticQuestion[] {
  const band = gradeBandFor(gradeLevel);
  const copy: Record<GradeBand, Array<[string, string, string[], string]>> = {
    EARLY: [
      ["Counting", "Which number comes after 7?", ["6", "8", "9", "10"], "B"],
      ["Letter sounds", "Which word starts with the same sound as sun?", ["sock", "cat", "map", "dog"], "A"],
      ["Addition", "What is 3 + 2?", ["4", "5", "6", "7"], "B"],
      ["Reading meaning", "A red ball rolls. What color is the ball?", ["blue", "green", "red", "yellow"], "C"],
      ["Patterns", "What comes next: circle, square, circle, square, ___?", ["star", "circle", "triangle", "heart"], "B"],
      ["Comparison", "Which number is greatest?", ["2", "4", "6", "3"], "C"],
    ],
    ELEMENTARY: [
      ["Place value", "What is the value of 6 in 364?", ["6", "60", "600", "3"], "B"],
      ["Main idea", "The main idea tells what a text is mostly about. Which detail best supports a main idea?", ["An unrelated fact", "A matching example", "A page number", "The author's name"], "B"],
      ["Multiplication", "What is 7 × 6?", ["36", "40", "42", "48"], "C"],
      ["Fractions", "Which fraction equals one half?", ["2/3", "3/6", "4/6", "1/3"], "B"],
      ["Evidence", "What should you use to support an answer about a passage?", ["A guess", "Text evidence", "A new topic", "Only the title"], "B"],
      ["Multi-step reasoning", "A box has 4 rows of 5 markers. Three are used. How many remain?", ["12", "15", "17", "23"], "C"],
    ],
    MIDDLE: [
      ["Ratios", "A recipe uses 2 cups of flour for 3 batches. How much for 6 batches?", ["3 cups", "4 cups", "6 cups", "9 cups"], "B"],
      ["Central idea", "Which statement best describes a central idea?", ["One minor detail", "The text's main message", "The longest sentence", "The first quotation"], "B"],
      ["Integers", "What is -4 + 9?", ["-13", "-5", "5", "13"], "C"],
      ["Variables", "Solve 3x = 21.", ["6", "7", "8", "18"], "B"],
      ["Scientific evidence", "Which result best supports a scientific claim?", ["A repeated controlled result", "One opinion", "An unrelated chart", "A prediction alone"], "A"],
      ["Inference", "A character grabs an umbrella after seeing dark clouds. What is a supported inference?", ["It is snowing", "Rain is expected", "The umbrella is broken", "It is midnight"], "B"],
    ],
    HIGH: [
      ["Linear relationships", "What is the slope of y = 3x - 4?", ["-4", "-3", "3", "4"], "C"],
      ["Argument evidence", "Which evidence most strengthens a causal claim?", ["A single anecdote", "A controlled comparison", "A definition", "A popular opinion"], "B"],
      ["Functions", "If f(x) = x² - 1, what is f(3)?", ["5", "6", "8", "10"], "C"],
      ["Scientific models", "Why do scientists revise models?", ["To hide results", "When new evidence improves explanations", "To avoid testing", "Because models are opinions"], "B"],
      ["Source evaluation", "Which source is strongest for a current scientific claim?", ["An anonymous post", "A peer-reviewed recent study", "An advertisement", "A fictional story"], "B"],
      ["Algebraic reasoning", "Solve 2(x + 3) = 14.", ["2", "4", "5", "8"], "B"],
    ],
  };

  return copy[band].map(([concept, prompt, choices, answer], index) => ({
    id: `fallback-${band.toLowerCase()}-${index + 1}`,
    concept,
    prerequisite: index > 1 ? copy[band][index - 2][0] : null,
    prompt,
    options: { A: choices[0], B: choices[1], C: choices[2], D: choices[3] },
    answer: answer as DiagnosticQuestion["answer"],
    difficulty: Math.min(5, index + 1),
    discrimination: 1,
    guessing: 0.2,
    standardCode: null,
    reason: `Checks ${concept.toLowerCase()} readiness at this grade band.`,
  }));
}

export function chooseNextQuestion(
  questions: DiagnosticQuestion[],
  responses: DiagnosticResponse[],
  ability: number
) {
  const answered = new Set(responses.map((response) => response.questionId));
  const targetDifficulty = 1 + ability * 4;
  return questions
    .filter((question) => !answered.has(question.id))
    .sort(
      (a, b) =>
        itemSelectionCost(a, targetDifficulty) - itemSelectionCost(b, targetDifficulty)
    )[0] ?? null;
}

function itemSelectionCost(question: DiagnosticQuestion, targetDifficulty: number) {
  const targetDistance = Math.abs(question.difficulty - targetDifficulty);
  const informationBonus = question.discrimination * (1 - question.guessing);
  return targetDistance - informationBonus * 0.2;
}

export function updateAbilityEstimate(
  ability: number,
  correct: boolean,
  question: Pick<DiagnosticQuestion, "difficulty" | "discrimination" | "guessing">
) {
  const theta = Math.log(Math.max(0.01, ability) / Math.max(0.01, 1 - ability));
  const itemDifficulty = (question.difficulty - 3) * 0.8;
  const logistic = 1 / (1 + Math.exp(-question.discrimination * (theta - itemDifficulty)));
  const probability = question.guessing + (1 - question.guessing) * logistic;
  const nextTheta = theta + 0.45 * question.discrimination *
    ((correct ? 1 : 0) - probability);
  return Math.max(0.03, Math.min(0.97, 1 / (1 + Math.exp(-nextTheta))));
}

export function publicQuestion(question: DiagnosticQuestion) {
  const { answer: _answer, ...safe } = question;
  return safe;
}
