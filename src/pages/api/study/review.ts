import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, cardId, correct } = req.body as {
    sessionId: string;
    cardId: string;
    correct: boolean;
  };

  if (!sessionId || !cardId || typeof correct !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  // 1️⃣ Create card review (MATCHES Prisma model: CardReview → card_reviews)
  await prisma.cardReview.create({
    data: {
      flashcard_id: cardId,
      session_id: sessionId,
      correct,
    },
  });

  // 2️⃣ Update study session counters (ATOMIC + SAFE)
  await prisma.study_sessions.update({
    where: { id: sessionId },
    data: correct
      ? { correct: { increment: 1 } }
      : { incorrect: { increment: 1 } },
  });

  return res.status(200).json({ ok: true });
}
