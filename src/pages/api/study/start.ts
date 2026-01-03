import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

/**
 * Local type for flashcards + reviews
 * (avoids Prisma client type import issues)
 */
type FlashcardWithReviews = {
  id: string;
  question: string;
  answer: string;
  created_at: Date;
  reviews: {
    correct: boolean;
  }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const userId = "demo-user"; // TEMP USER

  /**
   * 1️⃣ Fetch flashcards with review history
   */
  const cards = (await prisma.flashcard.findMany({
    where: { user_id: userId },
    include: { reviews: true },
  })) as FlashcardWithReviews[];

  /**
   * 2️⃣ Score cards by difficulty
   */
  const scoredCards = cards.map((card: FlashcardWithReviews) => {
    const total = card.reviews.length;
    const correct = card.reviews.filter(
      (r: { correct: boolean }) => r.correct
    ).length;

    const accuracy = total === 0 ? 0 : correct / total;

    return {
      ...card,
      accuracy,
      totalReviews: total,
    };
  });

  /**
   * 3️⃣ Sort by difficulty
   */
  scoredCards.sort(
    (
      a: { accuracy: number; totalReviews: number },
      b: { accuracy: number; totalReviews: number }
    ) => {
      if (a.totalReviews === 0 && b.totalReviews > 0) return -1;
      if (b.totalReviews === 0 && a.totalReviews > 0) return 1;
      return a.accuracy - b.accuracy;
    }
  );

  /**
   * 4️⃣ Select cards for session
   */
  const sessionCards = scoredCards.slice(0, 20);

  /**
   * 5️⃣ Create study session
   */
  const session = await prisma.study_sessions.create({
    data: {
      user_id: userId,
      total_cards: sessionCards.length,
      correct: 0,
      incorrect: 0,
    },
  });

  /**
   * 6️⃣ Return clean payload (no reviews)
   */
  return res.status(200).json({
    sessionId: session.id,
    cards: sessionCards.map(
      ({ reviews, accuracy, totalReviews, ...card }) => card
    ),
  });
}
