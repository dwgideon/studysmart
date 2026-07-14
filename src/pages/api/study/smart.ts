import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {return res.status(405).end();}

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: user.id },
    select: { dailyReviewLimit: true },
  });
  const limit = Math.max(5, Math.min(100, profile?.dailyReviewLimit ?? 20));
  const cards = await prisma.flashcard.findMany({
    where: { userId: user.id, nextReviewAt: { lte: new Date() } },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  res.status(200).json({
    dueCount: cards.length,
    cards: cards.map((card) => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      nextReviewAt: card.nextReviewAt,
    })),
  });
}
