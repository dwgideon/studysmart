type QuizOptionLetter = "A" | "B" | "C" | "D";

const OPTION_LETTERS: QuizOptionLetter[] = ["A", "B", "C", "D"];

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Reject malformed model output before it reaches the learner-facing quiz. */
export function isUsableQuizQuestion(question: unknown): boolean {
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return false;
  }
  const record = question as Record<string, unknown>;
  if (typeof record.question !== "string" || record.question.trim().length < 8) {
    return false;
  }
  if (!record.options || typeof record.options !== "object" || Array.isArray(record.options)) {
    return false;
  }
  const optionRecord = record.options as Record<string, unknown>;
  const values = OPTION_LETTERS.map((letter) => optionRecord[letter]);
  if (values.some((value) => typeof value !== "string" || value.trim().length === 0 || value.length > 1200)) {
    return false;
  }
  const uniqueValues = new Set(values.map((value) => normalized(value as string)));
  if (uniqueValues.size !== OPTION_LETTERS.length) {
    return false;
  }
  const answer = typeof record.answer === "string" ? record.answer.trim().toUpperCase() : "";
  return OPTION_LETTERS.includes(answer as QuizOptionLetter);
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
  return questions.filter(isUsableQuizQuestion).map(shuffleQuizOptions);
}
