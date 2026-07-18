export type GradeBand = "EARLY" | "ELEMENTARY" | "MIDDLE" | "HIGH";

export type Companion = {
  id: string;
  name: string;
  animal: string;
  emoji: string;
  trait: string;
  color: string;
  accent: string;
  elementary: boolean;
};

export type GameHub = {
  player: { name: string; xp: number; level: number; sparks: number };
  avatar: { hair: string; top: string; extra: string };
  owned: string[];
  catalog: Array<{
    id: string;
    slot: "hair" | "top" | "extra";
    name: string;
    description: string;
    price: number;
    color: string;
    icon: string;
  }>;
  experience: {
    gradeLevel: string;
    gradeBand: GradeBand;
    companion: Companion;
    companions: Companion[];
    readAloud: boolean;
    speechRate: number;
  };
  recentRuns: Array<{ id: string; mode: "GRID" | "BUILD"; project: string | null; score: number; xpEarned: number; sparksEarned: number }>;
  leaderboard: Array<{ rank: number; name: string; xp: number }>;
};

export type ProfileStats = {
  sessions: number;
  flashcards: number;
  quizzes: number;
  xp: number;
  level: number;
  mastery: number;
  streak: { currentStreak: number; longestStreak: number };
  activity: Array<{ title: string; subtitle: string; time: string }>;
};

export type ReviewQueue = {
  dueNow: number;
  dueTomorrow: number;
  dailyLimit: number;
  nextReviewAt: string | null;
};

export type Recommendation = {
  recommendation: {
    mode: string;
    title: string;
    reason: string;
    actionPath: string;
    actionLabel: string;
    confidence?: number;
  };
};

export type StudyCard = {
  id: string;
  question: string;
  answer: string;
  hint?: string | null;
};

export type StudySession = { sessionId: string; cards: StudyCard[] };

export type GameQuestion = {
  cardId: string;
  prompt: string;
  options: string[];
  category: string;
  value: number;
  difficulty: number;
  material: string;
};

export type GameRun = {
  runId: string;
  mode: "GRID" | "BUILD";
  project: string | null;
  rewardsEnabled: boolean;
  questions: GameQuestion[];
};

export type TutorMessage = { id: string; role: "user" | "assistant"; content: string };

export type TutorReply = {
  reply: string;
  conversationId?: string;
  safetyRedirect?: boolean;
  lockedUntil?: string;
  attribution?: {
    mode: "UPLOADED_MATERIAL" | "GENERAL_KNOWLEDGE";
    label: string;
    citations: Array<{ label: string; title: string; excerpt: string }>;
  };
};

export type GameAnswer = {
  correct: boolean;
  correctIndex: number;
  correctAnswer: string;
  reward: { xp: number; sparks: number };
  finished: boolean;
  score: number;
  xpEarned: number;
  sparksEarned: number;
  player: { xp: number; level: number; sparks: number };
  material: string | null;
};

export type MultiplayerRoomState = {
  room: {
    code: string;
    mode: string;
    status: "LOBBY" | "ACTIVE" | "FINISHED" | "CLOSED";
    phase: "LOBBY" | "QUESTION" | "REVEAL" | "RESULTS";
    isHost: boolean;
    currentQuestion: number;
    totalQuestions: number;
    maxPlayers: number;
    roundDurationSeconds: number;
    roundStartedAt: string | null;
    roundEndsAt: string | null;
    expiresAt: string;
    sharePath: string;
  };
  me: {
    alias: string;
    score: number;
    correctCount: number;
    xpEarned: number;
    sparksEarned: number;
    rewardsEnabled: boolean;
    selectedIndex: number | null;
    correct: boolean | null;
  };
  players: Array<{
    alias: string;
    score: number;
    correctCount: number;
    isHost: boolean;
    isMe: boolean;
    rank: number;
  }>;
  question: ({
    prompt: string;
    options: string[];
    category: string;
    value: number;
    difficulty: number;
    correctIndex?: number;
    correctAnswer?: string;
  }) | null;
  answeredCount: number;
  distribution: Array<{ optionIndex: number; count: number }>;
};

export type SafetyAlert = {
  id: string;
  learner: { id: string; name: string | null };
  category: string;
  source: string;
  attemptNumber: number;
  lockedUntil: string | null;
  createdAt: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  responseStatus: string;
  escalationLevel: number;
};
