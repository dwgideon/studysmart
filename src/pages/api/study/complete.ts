import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { databaseTransaction, prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { updateUserStreak } from "@/lib/streakService";
import { awardXp } from "@/lib/xp";

async function handler(
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

    const completedAt = new Date();
    const result = await databaseTransaction(async (tx) => {
      const claimed = await tx.studySession.updateMany({
        where: { id: sessionId, userId: user.id, completed: false },
        data: { completed: true, completedAt },
      });
      const session = await tx.studySession.findUniqueOrThrow({ where: { id: sessionId } });
      if (claimed.count === 0) {
        return { duplicate: true, session, xpEarned: 0, xp: null };
      }
      const xpEarned = session.correct * 10 + (session.incorrect > 0 ? 5 : 15);
      await updateUserStreak(user.id, tx);
      const xp = await awardXp(user.id, xpEarned, tx);
      return { duplicate: false, session, xpEarned, xp };
    });
    const { session, xpEarned, xp, duplicate } = result;

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
        completedAt: session.completedAt,
      },
      xpEarned,
      xp,
      duplicate,
    });
  } catch (error) {
    console.error("study/complete error:", error);
    return res.status(500).json({ error: "Failed to complete session" });
  }
}

export default withApiMonitoring("api.study.complete", handler);
