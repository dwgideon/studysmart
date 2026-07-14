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

  const totalCards = await prisma.flashcard.count({
    where: { userId: user.id },
  });

  const reviews = await prisma.cardReview.findMany({
    where: { userId: user.id },
    select: { correct: true },
  });

  const totalReviews = reviews.length;
  const correctReviews = reviews.filter((r) => r.correct).length;

  const accuracy =
    totalReviews === 0
      ? 0
      : Math.round((correctReviews / totalReviews) * 100);

  res.status(200).json({
    totalCards,
    totalReviews,
    correctReviews,
    accuracy,
  });
}
