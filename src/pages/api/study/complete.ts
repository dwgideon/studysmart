import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  // Mark session complete
  const session = await prisma.study_sessions.update({
    where: { id: sessionId },
    data: {
      completed_at: new Date(),
    },
  });

  const accuracy =
    session.total_cards > 0
      ? Math.round((session.correct / session.total_cards) * 100)
      : 0;

  return res.status(200).json({
    sessionId: session.id,
    total: session.total_cards,
    correct: session.correct,
    incorrect: session.incorrect,
    accuracy,
    completedAt: session.completed_at,
  });
}
