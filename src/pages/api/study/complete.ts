import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { updateUserStreak } from "@/lib/streakService";
import { awardXp } from "@/lib/xp";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const owned = await prisma.studySession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!owned) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = await prisma.studySession.update({
      where: { id: sessionId },
      data: { completed: true },
    });

    await updateUserStreak(user.id);

    const xpEarned =
      session.correct * 10 + (session.incorrect > 0 ? 5 : 15);
    const xp = await awardXp(user.id, xpEarned);

    const accuracy =
      session.totalCards > 0
        ? Math.round((session.correct / session.totalCards) * 100)
        : 0;

    return res.status(200).json({
      session: {
        id: session.id,
        correct: session.correct,
        incorrect: session.incorrect,
        total: session.totalCards,
        accuracy,
        completedAt: session.createdAt,
      },
      xpEarned,
      xp,
    });
  } catch (error) {
    console.error("study/complete error:", error);
    return res.status(500).json({ error: "Failed to complete session" });
  }
}
