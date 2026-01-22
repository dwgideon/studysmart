import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  _req: NextApiRequest, // underscore = intentionally unused
  res: NextApiResponse
) {
  const userId = "demo-user"; // TODO: replace with real session user

  const cards = await prisma.flashcard.findMany({
    where: { user_id: userId },
    include: {
      reviews: {
        orderBy: { reviewed_at: "desc" },
        take: 5,
      },
    },
  });

  const scored = cards.map((card) => {
    const incorrect = card.reviews.filter((r) => !r.correct).length;
    const lastReviewed = card.reviews[0]?.reviewed_at ?? new Date(0);

    const hoursSince =
      (Date.now() - lastReviewed.getTime()) / 1000 / 60 / 60;

    const score = incorrect * 5 - Math.floor(hoursSince);

    return { card, score };
  });

  scored.sort((a, b) => b.score - a.score);

  res.status(200).json({
    cards: scored.slice(0, 20).map((s) => s.card),
  });
}
