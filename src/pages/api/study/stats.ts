import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  _req: NextApiRequest, // underscore = intentionally unused
  res: NextApiResponse
) {
  const userId = "demo-user"; // TEMP until auth wiring

  const totalCards = await prisma.flashcard.count({
    where: { user_id: userId },
  });

  const totalReviews = await prisma.cardReview.count({
    where: {
      flashcard: { user_id: userId },
    },
  });

  const correctReviews = await prisma.cardReview.count({
    where: {
      flashcard: { user_id: userId },
      correct: true,
    },
  });

  const accuracy =
    totalReviews === 0 ? 0 : Math.round((correctReviews / totalReviews) * 100);

  res.status(200).json({
    totalCards,
    totalReviews,
    correctReviews,
    accuracy,
  });
}
