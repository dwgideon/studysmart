import { randomBytes } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/auth";
import { rewardForQuestion } from "@/lib/gameEconomy";
import {
  MULTIPLAYER_MAX_PLAYERS,
  MULTIPLAYER_ROUND_SECONDS,
  buildMultiplayerQuestions,
  friendlyPlayerAlias,
  isMultiplayerCode,
  multiplayerScore,
  normalizeMultiplayerCode,
  publicMultiplayerQuestion,
  roomExpiresAt,
  roundEndsAt,
  type StoredMultiplayerQuestion,
} from "@/lib/multiplayerGame";
import { databaseTransaction, prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rateLimit";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { recordMasteryEvidence } from "@/lib/masteryService";
import { scheduleNextReview } from "@/lib/spacedRepetition";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function roomCode() {
  return [...randomBytes(6)]
    .map((value) => CODE_ALPHABET[value % CODE_ALPHABET.length])
    .join("");
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

async function requireStudent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountRole: true },
  });
  if (user?.accountRole !== "STUDENT") {throw new Error("STUDENT_ONLY");}
}

async function rewardsAvailable(userId: string) {
  const rewardedRooms = await prisma.multiplayerParticipant.count({
    where: { userId, rewardsEnabled: true, joinedAt: { gte: startOfToday() } },
  });
  return rewardedRooms < 3;
}

async function uniqueRoomCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = roomCode();
    const existing = await prisma.multiplayerRoom.findUnique({ where: { code }, select: { id: true } });
    if (!existing) {return code;}
  }
  throw new Error("CODE_UNAVAILABLE");
}

async function refreshTimedState(code: string) {
  const now = new Date();
  await prisma.multiplayerRoom.updateMany({
    where: { code, status: { in: ["LOBBY", "ACTIVE"] }, expiresAt: { lte: now } },
    data: { status: "CLOSED", phase: "RESULTS", completedAt: now },
  });
  await prisma.multiplayerRoom.updateMany({
    where: { code, status: "ACTIVE", phase: "QUESTION", roundEndsAt: { lte: now } },
    data: { phase: "REVEAL" },
  });
}

async function roomState(userId: string, rawCode: unknown) {
  const code = normalizeMultiplayerCode(rawCode);
  if (!isMultiplayerCode(code)) {throw new Error("INVALID_CODE");}
  await refreshTimedState(code);
  const room = await prisma.multiplayerRoom.findUnique({
    where: { code },
    include: {
      participants: {
        where: { leftAt: null },
        orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
      },
    },
  });
  if (!room) {throw new Error("ROOM_NOT_FOUND");}
  const me = room.participants.find((participant) => participant.userId === userId);
  if (!me) {throw new Error("NOT_IN_ROOM");}

  const questions = room.questions as unknown as StoredMultiplayerQuestion[];
  const question = room.currentQuestion >= 0 ? questions[room.currentQuestion] : undefined;
  const answers = room.currentQuestion >= 0
    ? await prisma.multiplayerAnswer.findMany({
        where: { roomId: room.id, questionIndex: room.currentQuestion },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const myAnswer = answers.find((answer) => answer.participantId === me.id);
  const reveal = room.phase === "REVEAL" || room.phase === "RESULTS";
  const distribution = question && reveal
    ? question.options.map((_, optionIndex) => ({
        optionIndex,
        count: answers.filter((answer) => answer.selectedIndex === optionIndex).length,
      }))
    : [];

  return {
    room: {
      code: room.code,
      mode: room.mode,
      status: room.status,
      phase: room.phase,
      isHost: room.hostUserId === userId,
      currentQuestion: room.currentQuestion,
      totalQuestions: questions.length,
      maxPlayers: room.maxPlayers,
      roundDurationSeconds: room.roundDurationSeconds,
      roundStartedAt: room.roundStartedAt?.toISOString() ?? null,
      roundEndsAt: room.roundEndsAt?.toISOString() ?? null,
      expiresAt: room.expiresAt.toISOString(),
      sharePath: `/multiplayer/${room.code}`,
    },
    me: {
      alias: me.alias,
      score: me.score,
      correctCount: me.correctCount,
      xpEarned: me.xpEarned,
      sparksEarned: me.sparksEarned,
      rewardsEnabled: me.rewardsEnabled,
      selectedIndex: myAnswer?.selectedIndex ?? null,
      correct: reveal ? myAnswer?.correct ?? null : null,
    },
    players: room.participants.map((participant, index) => ({
      alias: participant.alias,
      score: participant.score,
      correctCount: participant.correctCount,
      isHost: participant.userId === room.hostUserId,
      isMe: participant.userId === userId,
      rank: index + 1,
    })),
    question: question ? publicMultiplayerQuestion(question, reveal) : null,
    answeredCount: answers.length,
    distribution,
  };
}

async function createRoom(userId: string) {
  await requireStudent(userId);
  const now = new Date();
  const existing = await prisma.multiplayerRoom.findFirst({
    where: { hostUserId: userId, status: { in: ["LOBBY", "ACTIVE"] }, expiresAt: { gt: now } },
    select: { code: true },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {return roomState(userId, existing.code);}

  const cards = await prisma.flashcard.findMany({
    where: { userId },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
    take: 36,
    select: { id: true, question: true, answer: true },
  });
  if (cards.length < 3) {throw new Error("NEED_CARDS");}
  const questions = buildMultiplayerQuestions(cards);
  if (questions.length < 3) {throw new Error("NEED_CARDS");}
  const code = await uniqueRoomCode();
  const rewardsEnabled = await rewardsAvailable(userId);
  const room = await prisma.multiplayerRoom.create({
    data: {
      code,
      hostUserId: userId,
      questions: questions as unknown as Prisma.InputJsonValue,
      expiresAt: roomExpiresAt(now),
      maxPlayers: MULTIPLAYER_MAX_PLAYERS,
      roundDurationSeconds: MULTIPLAYER_ROUND_SECONDS,
      participants: {
        create: { userId, alias: friendlyPlayerAlias(0), rewardsEnabled },
      },
    },
  });
  await prisma.auditEvent.create({
    data: {
      actorUserId: userId,
      subjectId: userId,
      action: "STUDENT_MULTIPLAYER_ROOM_CREATED",
      resourceType: "MultiplayerRoom",
      resourceId: room.id,
      metadata: { mode: room.mode, maxPlayers: room.maxPlayers },
    },
  });
  return roomState(userId, code);
}

async function joinRoom(userId: string, rawCode: unknown) {
  await requireStudent(userId);
  const allowed = await consumeRateLimit(userId, "MULTIPLAYER_JOIN", 12, 60_000);
  if (!allowed) {throw new Error("RATE_LIMITED");}
  const code = normalizeMultiplayerCode(rawCode);
  if (!isMultiplayerCode(code)) {throw new Error("INVALID_CODE");}
  const room = await prisma.multiplayerRoom.findUnique({ where: { code } });
  if (!room || room.expiresAt <= new Date() || room.status === "CLOSED") {throw new Error("ROOM_NOT_FOUND");}

  const existing = await prisma.multiplayerParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } },
  });
  if (existing) {
    await prisma.multiplayerParticipant.update({ where: { id: existing.id }, data: { leftAt: null } });
    return roomState(userId, code);
  }
  if (room.status !== "LOBBY") {throw new Error("ROOM_STARTED");}

  const rewardsEnabled = await rewardsAvailable(userId);
  let joined = false;
  for (let attempt = 0; attempt < 5 && !joined; attempt += 1) {
    try {
      await databaseTransaction(async (tx) => {
        const participants = await tx.multiplayerParticipant.findMany({
          where: { roomId: room.id },
          select: { alias: true, leftAt: true },
        });
        if (participants.filter((participant) => !participant.leftAt).length >= room.maxPlayers) {
          throw new Error("ROOM_FULL");
        }
        const usedAliases = new Set(participants.map((participant) => participant.alias));
        const alias = Array.from({ length: room.maxPlayers }, (_, index) => friendlyPlayerAlias(index))
          .find((candidate) => !usedAliases.has(candidate));
        if (!alias) {throw new Error("ROOM_FULL");}
        await tx.multiplayerParticipant.create({
          data: { roomId: room.id, userId, alias, rewardsEnabled },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      joined = true;
    } catch (error) {
      if (error instanceof Error && error.message === "ROOM_FULL") {throw error;}
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !["P2002", "P2034"].includes(error.code)) {
        throw error;
      }
      const concurrentJoin = await prisma.multiplayerParticipant.findUnique({
        where: { roomId_userId: { roomId: room.id, userId } },
      });
      if (concurrentJoin) {joined = true;}
    }
  }
  if (!joined) {throw new Error("ROOM_BUSY");}
  await prisma.auditEvent.create({
    data: {
      actorUserId: userId,
      subjectId: userId,
      action: "STUDENT_MULTIPLAYER_ROOM_JOINED",
      resourceType: "MultiplayerRoom",
      resourceId: room.id,
    },
  });
  return roomState(userId, code);
}

async function hostAction(userId: string, rawCode: unknown, action: string) {
  const code = normalizeMultiplayerCode(rawCode);
  if (!isMultiplayerCode(code)) {throw new Error("INVALID_CODE");}
  await refreshTimedState(code);
  const room = await prisma.multiplayerRoom.findFirst({ where: { code, hostUserId: userId } });
  if (!room) {throw new Error("HOST_ONLY");}
  const now = new Date();
  const questions = room.questions as unknown as StoredMultiplayerQuestion[];

  if (action === "start") {
    if (room.status !== "LOBBY") {throw new Error("INVALID_PHASE");}
    await prisma.multiplayerRoom.update({
      where: { id: room.id },
      data: {
        status: "ACTIVE",
        phase: "QUESTION",
        currentQuestion: 0,
        roundStartedAt: now,
        roundEndsAt: roundEndsAt(now, room.roundDurationSeconds),
      },
    });
  } else if (action === "reveal") {
    if (room.status !== "ACTIVE" || room.phase !== "QUESTION") {throw new Error("INVALID_PHASE");}
    await prisma.multiplayerRoom.update({ where: { id: room.id }, data: { phase: "REVEAL" } });
  } else if (action === "next") {
    if (room.status !== "ACTIVE" || room.phase !== "REVEAL") {throw new Error("INVALID_PHASE");}
    const nextQuestion = room.currentQuestion + 1;
    if (nextQuestion >= questions.length) {
      await prisma.multiplayerRoom.update({
        where: { id: room.id },
        data: { status: "FINISHED", phase: "RESULTS", completedAt: now, roundEndsAt: null },
      });
    } else {
      await prisma.multiplayerRoom.update({
        where: { id: room.id },
        data: {
          phase: "QUESTION",
          currentQuestion: nextQuestion,
          roundStartedAt: now,
          roundEndsAt: roundEndsAt(now, room.roundDurationSeconds),
        },
      });
    }
  } else if (action === "close") {
    await prisma.multiplayerRoom.update({
      where: { id: room.id },
      data: { status: "CLOSED", phase: "RESULTS", completedAt: now, roundEndsAt: null },
    });
  }
  return roomState(userId, code);
}

async function answerQuestion(userId: string, rawCode: unknown, rawSelectedIndex: unknown) {
  const code = normalizeMultiplayerCode(rawCode);
  const selectedIndex = Number(rawSelectedIndex);
  if (!isMultiplayerCode(code) || !Number.isInteger(selectedIndex)) {throw new Error("BAD_ANSWER");}
  const now = new Date();

  await databaseTransaction(async (tx) => {
    const room = await tx.multiplayerRoom.findUnique({ where: { code } });
    if (!room || room.status !== "ACTIVE" || room.phase !== "QUESTION") {throw new Error("ROUND_CLOSED");}
    if (!room.roundStartedAt || !room.roundEndsAt || room.roundEndsAt.getTime() + 3_000 < now.getTime()) {
      throw new Error("ROUND_CLOSED");
    }
    const participant = await tx.multiplayerParticipant.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });
    if (!participant || participant.leftAt) {throw new Error("NOT_IN_ROOM");}
    const questions = room.questions as unknown as StoredMultiplayerQuestion[];
    const question = questions[room.currentQuestion];
    if (!question || question.options[selectedIndex] === undefined) {throw new Error("BAD_ANSWER");}
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
    if (!card) {throw new Error("BAD_ANSWER");}
    const correct = question.correctIndex === selectedIndex;
    const points = multiplayerScore(correct, question.value, room.roundStartedAt, room.roundEndsAt, now);
    const reward = rewardForQuestion(correct, question.difficulty, participant.rewardsEnabled);
    await tx.multiplayerAnswer.create({
      data: {
        roomId: room.id,
        participantId: participant.id,
        questionIndex: room.currentQuestion,
        selectedIndex,
        correct,
        points,
        responseMs: Math.max(0, now.getTime() - room.roundStartedAt.getTime()),
      },
    });
    await tx.multiplayerParticipant.update({
      where: { id: participant.id },
      data: {
        score: { increment: points },
        correctCount: { increment: correct ? 1 : 0 },
        xpEarned: { increment: reward.xp },
        sparksEarned: { increment: reward.sparks },
      },
    });
    let masteryScore = 0;
    if (card.conceptId) {
      const recorded = await recordMasteryEvidence(tx, {
        userId,
        conceptId: card.conceptId,
        sourceType: "MULTIPLAYER_ANSWER",
        sourceId: room.id,
        correct,
        difficulty: Math.min(1, Math.max(0, question.difficulty / 3)),
        responseTimeMs: Math.max(0, now.getTime() - room.roundStartedAt.getTime()),
        independent: true,
      });
      masteryScore = recorded.score;
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
        responseTimeMs: Math.max(0, now.getTime() - room.roundStartedAt.getTime()),
        rating: correct ? 3 : 1,
      },
    });
    await tx.flashcard.update({ where: { id: card.id }, data: schedule });
    if (reward.xp) {
      await tx.user.update({ where: { id: userId }, data: { xp: { increment: reward.xp } } });
    }
    await tx.gameProfile.upsert({
      where: { userId },
      create: { userId, sparks: reward.sparks, lifetimeSparks: reward.sparks },
      update: { sparks: { increment: reward.sparks }, lifetimeSparks: { increment: reward.sparks } },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return roomState(userId, code);
}

async function leaveRoom(userId: string, rawCode: unknown) {
  const code = normalizeMultiplayerCode(rawCode);
  const room = await prisma.multiplayerRoom.findUnique({ where: { code } });
  if (!room) {throw new Error("ROOM_NOT_FOUND");}
  if (room.hostUserId === userId) {
    await prisma.multiplayerRoom.update({
      where: { id: room.id },
      data: { status: "CLOSED", phase: "RESULTS", completedAt: new Date(), roundEndsAt: null },
    });
  } else {
    await prisma.multiplayerParticipant.updateMany({
      where: { roomId: room.id, userId },
      data: { leftAt: new Date() },
    });
  }
  return { ok: true };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST'].includes(req.method ?? '')) {return res.status(405).end();}
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  try {
    if (req.method === "GET") {
      return res.status(200).json(await roomState(authUser.id, req.query.code));
    }
    const action = String(req.body?.action ?? "");
    if (action === "create") {return res.status(201).json(await createRoom(authUser.id));}
    if (action === "join") {return res.status(200).json(await joinRoom(authUser.id, req.body?.code));}
    if (["start", "reveal", "next", "close"].includes(action)) {
      return res.status(200).json(await hostAction(authUser.id, req.body?.code, action));
    }
    if (action === "answer") {
      return res.status(200).json(await answerQuestion(authUser.id, req.body?.code, req.body?.selectedIndex));
    }
    if (action === "leave") {return res.status(200).json(await leaveRoom(authUser.id, req.body?.code));}
    return res.status(400).json({ error: "Unknown multiplayer action." });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MULTIPLAYER_ERROR";
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "That answer or room entry was already recorded." });
    }
    const known: Record<string, [number, string]> = {
      STUDENT_ONLY: [403, "Student rooms are available to signed-in student accounts."],
      INVALID_CODE: [400, "Enter a valid six-character room code."],
      ROOM_NOT_FOUND: [404, "That room code is not active."],
      NOT_IN_ROOM: [403, "Join this room before viewing or answering."],
      HOST_ONLY: [403, "Only the student who created the room can control the round."],
      ROOM_STARTED: [409, "That round has already started."],
      ROOM_FULL: [409, "That room is full."],
      INVALID_PHASE: [409, "The room has already moved to another stage."],
      ROUND_CLOSED: [409, "That question is closed. Your room is refreshing."],
      BAD_ANSWER: [400, "Choose one of the available answers."],
      NEED_CARDS: [400, "Add at least three flashcards before hosting a multiplayer room."],
      RATE_LIMITED: [429, "Too many room attempts. Wait a minute and try again."],
      ROOM_BUSY: [409, "Many students joined at once. Tap join again to enter the room."],
      CODE_UNAVAILABLE: [503, "A room code could not be reserved. Please try again."],
    };
    const response = known[code];
    if (response) {return res.status(response[0]).json({ error: response[1] });}
    console.error("multiplayer room error", error);
    return res.status(500).json({ error: "The multiplayer room could not continue. Please try again." });
  }
}

export default withApiMonitoring("api.games.multiplayer", handler);
