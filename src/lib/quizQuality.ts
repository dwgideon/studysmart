type QuizOptionLetter = "A" | "B" | "C" | "D";

const OPTION_LETTERS: QuizOptionLetter[] = ["A", "B", "C", "D"];

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function wordCount(value: string) {
  return normalized(value).split(/\s+/).filter(Boolean).length;
}

type QuizQualityReport = {
  valid: boolean;
  score: number;
  issues: string[];
};

/** Explainable quality gate for generated questions. */
export function quizQualityReport(question: unknown): QuizQualityReport {
  const issues: string[] = [];
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return { valid: false, score: 0, issues: ["question_not_an_object"] };
  }
  const record = question as Record<string, unknown>;
  const prompt = typeof record.question === "string" ? record.question.trim() : "";
  if (prompt.length < 8) {issues.push("question_too_short");}
  if (prompt.includes("? ?")) {issues.push("malformed_question");}
  if (!record.options || typeof record.options !== "object" || Array.isArray(record.options)) {
    return { valid: false, score: 0, issues: [...issues, "options_missing"] };
  }
  const optionRecord = record.options as Record<string, unknown>;
  const values = OPTION_LETTERS.map((letter) => optionRecord[letter]);
  if (values.some((value) => typeof value !== "string" || value.trim().length === 0 || value.length > 1200)) {
    issues.push("option_missing_or_too_long");
  }
  const strings = values.filter((value): value is string => typeof value === "string").map((value) => value.trim());
  const uniqueValues = new Set(strings.map(normalized));
  if (uniqueValues.size !== OPTION_LETTERS.length) {issues.push("duplicate_options");}
  if (strings.some((value) => /^(all|none) of the above[.!]?$/i.test(value))) {
    issues.push("weak_meta_option");
  }
  if (strings.length === OPTION_LETTERS.length) {
    const lengths = strings.map(wordCount);
    const shortest = Math.max(1, Math.min(...lengths));
    if (Math.max(...lengths) > shortest * 3 + 6) {issues.push("option_length_clue");}
  }
  const answer = typeof record.answer === "string" ? record.answer.trim().toUpperCase() : "";
  if (!OPTION_LETTERS.includes(answer as QuizOptionLetter)) {issues.push("answer_key_invalid");}
  const answerText = OPTION_LETTERS.includes(answer as QuizOptionLetter)
    ? optionRecord[answer] as string
    : "";
  if (answerText && normalized(prompt).includes(normalized(answerText)) && normalized(answerText).length >= 10) {
    issues.push("answer_repeated_in_prompt");
  }
  if ("explanation" in record && (typeof record.explanation !== "string" || record.explanation.trim().length < 8)) {
    issues.push("explanation_missing");
  }
  if ("concept" in record && (typeof record.concept !== "string" || record.concept.trim().length < 2)) {
    issues.push("concept_missing");
  }
  const score = Math.max(0, Number((1 - issues.length / 7).toFixed(3)));
  return { valid: issues.length === 0, score, issues };
}

/** Reject malformed model output before it reaches the learner-facing quiz. */
export function isUsableQuizQuestion(question: unknown): boolean {
  return quizQualityReport(question).valid;
}

/** Randomize answer positions so learners cannot exploit a fixed answer pattern. */
export function shuffleQuizOptions(question: unknown): unknown {
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return question;
  }

  const record = question as Record<string, unknown>;
  if (!record.options || typeof record.options !== "object" || Array.isArray(record.options)) {
    return question;
  }

  const optionRecord = record.options as Record<string, unknown>;
  const answer = typeof record.answer === "string" ? record.answer.trim().toUpperCase() : "";
  const values = OPTION_LETTERS.map((letter) => optionRecord[letter]);
  if (!OPTION_LETTERS.includes(answer as QuizOptionLetter) || values.some((value) => typeof value !== "string" || !value.trim())) {
    return question;
  }

  const shuffled = values.map((text, index) => ({ text, correct: OPTION_LETTERS[index] === answer }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  const options: Record<QuizOptionLetter, string> = {
    A: shuffled[0].text as string,
    B: shuffled[1].text as string,
    C: shuffled[2].text as string,
    D: shuffled[3].text as string,
  };
  const nextAnswer = OPTION_LETTERS[shuffled.findIndex((option) => option.correct)];
  return { ...record, options, answer: nextAnswer };
}

export function shuffleQuizQuestions(questions: unknown[]) {
  const seenPrompts = new Set<string>();
  return questions
    .filter(isUsableQuizQuestion)
    .filter((question) => {
      const prompt = normalized(String((question as Record<string, unknown>).question));
      if (seenPrompts.has(prompt)) {return false;}
      seenPrompts.add(prompt);
      return true;
    })
    .map(shuffleQuizOptions);
}
