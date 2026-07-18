export const MULTIPLAYER_MAX_PLAYERS = 30;
const MULTIPLAYER_QUESTION_COUNT = 8;
const MULTIPLAYER_ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;
export const MULTIPLAYER_ROUND_SECONDS = 30;

type MultiplayerCardInput = {
  id: string;
  question: string;
  answer: string;
};

export type StoredMultiplayerQuestion = {
  cardId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  category: string;
  value: number;
  difficulty: number;
};

const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
const ALIAS_COLORS = ["Blue", "Bright", "Coral", "Golden", "Green", "Indigo"];
const ALIAS_ANIMALS = ["Fox", "Otter", "Owl", "Panda", "Tiger"];

export function normalizeMultiplayerCode(value: unknown) {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    : "";
}

export function isMultiplayerCode(value: string) {
  return ROOM_CODE_PATTERN.test(value);
}

export function friendlyPlayerAlias(ordinal: number) {
  const safeOrdinal = Math.max(0, Math.floor(ordinal)) % (ALIAS_COLORS.length * ALIAS_ANIMALS.length);
  const color = ALIAS_COLORS[safeOrdinal % ALIAS_COLORS.length];
  const animal = ALIAS_ANIMALS[Math.floor(safeOrdinal / ALIAS_COLORS.length)];
  return `${color} ${animal}`;
}

function shuffled<T>(items: T[], random: () => number) {
  return items
    .map((value, index) => ({ value, index, order: random() }))
    .sort((left, right) => left.order - right.order || left.index - right.index)
    .map(({ value }) => value);
}

export function buildMultiplayerQuestions(
  cards: MultiplayerCardInput[],
  random: () => number = Math.random
) {
  const usable = cards.filter((card) => card.question.trim() && card.answer.trim());
  const selected = shuffled(usable, random).slice(0, MULTIPLAYER_QUESTION_COUNT);
  const answerPool = [...new Set(usable.map((card) => card.answer.trim()))];
  const categories = ["Core Ideas", "Meaning & Details", "Connections", "Challenge"];

  return selected.map<StoredMultiplayerQuestion>((card, questionIndex) => {
    const correctAnswer = card.answer.trim();
    const distractors = shuffled(
      answerPool.filter((answer) => answer !== correctAnswer),
      random
    ).slice(0, 3);
    const options = shuffled([correctAnswer, ...distractors], random);
    return {
      cardId: card.id,
      prompt: card.question.trim(),
      options,
      correctIndex: options.indexOf(correctAnswer),
      correctAnswer,
      category: categories[questionIndex % categories.length],
      value: (Math.floor(questionIndex / 2) + 1) * 100,
      difficulty: Math.min(3, Math.floor(questionIndex / 3) + 1),
    };
  });
}

type PublicMultiplayerQuestion = Pick<
  StoredMultiplayerQuestion,
  "prompt" | "options" | "category" | "value" | "difficulty"
>;

export function publicMultiplayerQuestion(
  question: StoredMultiplayerQuestion,
  revealAnswer: true
): PublicMultiplayerQuestion & Pick<StoredMultiplayerQuestion, "correctIndex" | "correctAnswer">;
export function publicMultiplayerQuestion(
  question: StoredMultiplayerQuestion,
  revealAnswer: false
): PublicMultiplayerQuestion;
export function publicMultiplayerQuestion(
  question: StoredMultiplayerQuestion,
  revealAnswer: boolean
): PublicMultiplayerQuestion | (PublicMultiplayerQuestion & Pick<StoredMultiplayerQuestion, "correctIndex" | "correctAnswer">);
export function publicMultiplayerQuestion(
  question: StoredMultiplayerQuestion,
  revealAnswer: boolean
) {
  const publicQuestion = {
    prompt: question.prompt,
    options: question.options,
    category: question.category,
    value: question.value,
    difficulty: question.difficulty,
  };
  return revealAnswer
    ? { ...publicQuestion, correctIndex: question.correctIndex, correctAnswer: question.correctAnswer }
    : publicQuestion;
}

export function multiplayerScore(
  correct: boolean,
  value: number,
  roundStartedAt: Date,
  roundEndsAt: Date,
  answeredAt: Date
) {
  if (!correct) {return 0;}
  const duration = Math.max(1, roundEndsAt.getTime() - roundStartedAt.getTime());
  const remaining = Math.max(0, roundEndsAt.getTime() - answeredAt.getTime());
  const speedBonus = Math.round(Math.min(1, remaining / duration) * 50);
  return Math.max(0, Math.round(value)) + speedBonus;
}

export function roomExpiresAt(now = new Date()) {
  return new Date(now.getTime() + MULTIPLAYER_ROOM_LIFETIME_MS);
}

export function roundEndsAt(now = new Date(), seconds = MULTIPLAYER_ROUND_SECONDS) {
  return new Date(now.getTime() + Math.max(10, Math.min(90, Math.round(seconds))) * 1000);
}
