import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const userId = "demo-user"; // TEMP

  const cards = await prisma.flashcard.findMany({
    where: { user_id: userId },
    take: 10,
  });

  const questions = cards.map((card) => {
    const wrongAnswers = shuffle(
      cards.filter((c) => c.id !== card.id).map((c) => c.answer)
    ).slice(0, 3);

    return {
      id: card.id,
      question: card.question,
      correctAnswer: card.answer,
      options: shuffle([card.answer, ...wrongAnswers]),
    };
  });

  res.status(200).json({ questions });
}
