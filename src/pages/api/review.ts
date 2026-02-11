import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

const { cardId, sessionId, correct, seconds: _seconds } = req.body;


  if (!cardId || !sessionId) {
    return res.status(400).json({ error: "Missing data" });
  }

  // 1️⃣ Log the review (THIS is where learning data lives)
  await prisma.cardReview.create({
  data: {
    flashcard_id: cardId,
    session_id: sessionId,
    correct: Boolean(correct),
    reviewed_at: new Date(),
  },
});

  // 2️⃣ Update session totals
  await prisma.study_sessions.update({
    where: { id: sessionId },
    data: correct
      ? { correct: { increment: 1 } }
      : { incorrect: { increment: 1 } },
  });

  return res.status(200).json({ ok: true });
}
