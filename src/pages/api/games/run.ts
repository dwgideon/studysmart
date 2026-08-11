import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { Prisma } from "@prisma/client";
import { databaseTransaction, prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { GameMode, rewardForQuestion, levelForXp } from "@/lib/gameEconomy";
import { recordMasteryEvidence } from "@/lib/masteryService";
import { scheduleNextReview } from "@/lib/spacedRepetition";

type StoredQuestion = {
  cardId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  category: string;
  value: number;
  difficulty: number;
  material: string;
  answer: string;
};

type AnswerRecord = { questionIndex: number; selectedIndex: number; correct: boolean };

const publicQuestion = ({ correctIndex: _correctIndex, answer: _answer, ...question }: StoredQuestion) => question;
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

async function startRun(userId: string, mode: GameMode, project?: string) {
  const cards = await prisma.flashcard.findMany({
    where: { userId },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
    take: 36,
  });
  if (cards.length < 3) {throw new Error("NEED_CARDS");}

  const selected = shuffle(cards).slice(0, mode === "GRID" ? 12 : 8);
  const answers = [...new Set(cards.map((card) => card.answer.trim()).filter(Boolean))];
  const materials = ["Timber", "Alloy", "Energy", "Glass"];
  const questions: StoredQuestion[] = selected.map((card, questionIndex) => {
    const distractors = shuffle(answers.filter((answer) => answer !== card.answer.trim())).slice(0, 3);
    const options = shuffle([card.answer.trim(), ...distractors]);
    return {
      cardId: card.id,
      prompt: card.question,
      options,
      correctIndex: options.indexOf(card.answer.trim()),
      category: ["Core Ideas", "Meaning & Details", "Connections", "Challenge"][questionIndex % 4],
      value: (Math.floor(questionIndex / 3) + 1) * 100,
      difficulty: Math.min(3, Math.floor(questionIndex / 4) + 1),
      material: materials[questionIndex % materials.length],
      answer: card.answer.trim(),
    };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rewardedRunsToday = await prisma.gameRun.count({ where: { userId, createdAt: { gte: today }, rewardsEnabled: true } });
  const safeProject = ["Sky Station", "Eco Rover", "Dream Library"].includes(project || "") ? project : "Sky Station";
  const run = await prisma.gameRun.create({
    data: { userId, mode, project: mode === "BUILD" ? safeProject : null, questions, answers: [], rewardsEnabled: rewardedRunsToday < 5 },
  });
  return { runId: run.id, mode, project: run.project, rewardsEnabled: run.rewardsEnabled, questions: questions.map(publicQuestion) };
}

async function answerQuestion(userId: string, runId: string, questionIndex: number, selectedIndex: number) {
  return databaseTransaction(async (tx) => {
    const run = await tx.gameRun.findFirst({ where: { id: runId, userId } });
    if (!run || run.completedAt) {throw new Error("RUN_CLOSED");}
    const questions = run.questions as unknown as StoredQuestion[];
    const answers = run.answers as unknown as AnswerRecord[];
    const question = questions[questionIndex];
    if (!question || !Number.isInteger(selectedIndex) || !question.options[selectedIndex]) {throw new Error("BAD_ANSWER");}
    if (answers.some((answer) => answer.questionIndex === questionIndex)) {throw new Error("ALREADY_ANSWERED");}

    const card = await tx.flashcard.findFirst({
      where: { id: question.cardId, userId },
      select: {
        id: true,
        conceptId: true,
        intervalDays: true,
        easeFactor: true,
        scheduledReviewCount: true,
        lapseCount: true,
        memoryStability: true,
        memoryDifficulty: true,
        targetRetention: true,
      },
    });
    if (!card) {throw new Error("CARD_NOT_FOUND");}

    const correct = question.correctIndex === selectedIndex;
    const reward = rewardForQuestion(correct, question.difficulty, run.rewardsEnabled);
    const nextAnswers = [...answers, { questionIndex, selectedIndex, correct }];
    const finished = nextAnswers.length === questions.length;
    const updated = await tx.gameRun.update({
      where: { id: run.id },
      data: {
        answers: nextAnswers as unknown as Prisma.InputJsonValue,
        currentIndex: nextAnswers.length,
        score: { increment: correct ? 1 : 0 },
        xpEarned: { increment: reward.xp },
        sparksEarned: { increment: reward.sparks },
        completedAt: finished ? new Date() : undefined,
      },
    });

    let mastery = null;
    let masteryScore = 0;
    if (card.conceptId) {
      const recorded = await recordMasteryEvidence(tx, {
        userId,
        conceptId: card.conceptId,
        sourceType: "GAME_ANSWER",
        sourceId: run.id,
        correct,
        difficulty: Math.min(1, Math.max(0, question.difficulty / 3)),
        independent: true,
      });
      masteryScore = recorded.score;
      mastery = {
        score: recorded.score,
        confidence: recorded.confidence,
        status: recorded.status,
      };
    }
    const schedule = scheduleNextReview({
      correct,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      reviewCount: card.scheduledReviewCount,
      lapseCount: card.lapseCount,
      masteryScore,
      rating: correct ? 3 : 1,
      memoryStability: card.memoryStability,
      memoryDifficulty: card.memoryDifficulty,
      targetRetention: card.targetRetention,
    });
    await tx.cardReview.create({
      data: {
        userId,
        flashcardId: card.id,
        correct,
        rating: correct ? 3 : 1,
      },
    });
    await tx.flashcard.update({ where: { id: card.id }, data: schedule });

    const player = reward.xp
      ? await tx.user.update({ where: { id: userId }, data: { xp: { increment: reward.xp } }, select: { xp: true } })
      : await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true } });
    const profile = await tx.gameProfile.upsert({
      where: { userId },
      create: { userId, sparks: reward.sparks, lifetimeSparks: reward.sparks },
      update: { sparks: { increment: reward.sparks }, lifetimeSparks: { increment: reward.sparks } },
    });
    return {
      correct,
      correctIndex: question.correctIndex,
      correctAnswer: question.answer,
      reward,
      finished,
      score: updated.score,
      xpEarned: updated.xpEarned,
      sparksEarned: updated.sparksEarned,
      player: { xp: player.xp, level: levelForXp(player.xp), sparks: profile.sparks },
      material: correct && run.mode === "BUILD" ? question.material : null,
      mastery,
      schedule,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {return res.status(405).end();}
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  try {
    if (req.body?.action === "start") {
      const mode = req.body.mode === "BUILD" ? "BUILD" : "GRID";
      return res.status(200).json(await startRun(user.id, mode, req.body.project));
    }
    if (req.body?.action === "answer") {
      const result = await answerQuestion(user.id, String(req.body.runId || ""), Number(req.body.questionIndex), Number(req.body.selectedIndex));
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: "Unknown game action." });
  } catch (error) {
    const code = error instanceof Error ? error.message : "GAME_ERROR";
    if (code === "NEED_CARDS") {return res.status(400).json({ error: "Add at least 3 flashcards to unlock learning games." });}
    if (["RUN_CLOSED", "BAD_ANSWER", "ALREADY_ANSWERED", "CARD_NOT_FOUND"].includes(code)) {return res.status(409).json({ error: "That answer could not be recorded. Your rewards are safe." });}
    console.error("game run error", error);
    return res.status(500).json({ error: "The game could not continue. Please try again." });
  }
}

export default withApiMonitoring("api.games.run", handler);
