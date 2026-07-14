import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getStreakSummary } from "@/lib/streakService";
import { getUserXp } from "@/lib/xp";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {return res.status(405).end();}

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const [sessions, flashcards, quizzes, xp, streak] = await Promise.all([
    prisma.studySession.count({ where: { userId: user.id, completed: true } }),
    prisma.flashcard.count({ where: { userId: user.id } }),
    prisma.savedQuiz.count({ where: { userId: user.id } }),
    getUserXp(user.id),
    getStreakSummary(user.id),
  ]);

  const recentSessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { flashcards: { take: 1 } },
  });

  const activity = recentSessions.map((s) => ({
    title: s.completed ? "Completed study session" : "Started study session",
    subtitle:
      s.title ?? s.flashcards[0]?.question?.slice(0, 48) ?? "Study session",
    time: s.createdAt.toISOString(),
  }));

  const mastery =
    flashcards === 0
      ? 0
      : Math.min(
          100,
          Math.round((xp / Math.max(flashcards * 15, 1)) * 100)
        );

  res.status(200).json({
    sessions,
    flashcards,
    quizzes,
    xp,
    level: Math.floor(xp / 100) + 1,
    streak,
    mastery,
    activity,
  });
}
