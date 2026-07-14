import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).end();
  }

  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const sessionId =
    typeof req.query.sessionId === "string"
      ? req.query.sessionId
      : (req.body as { sessionId?: string })?.sessionId;

  const cards = await prisma.flashcard.findMany({
    where: sessionId
      ? { userId: user.id, sessionId }
      : { userId: user.id },
    take: 20,
  });

  if (cards.length < 4) {
    return res.status(400).json({
      error: "Need at least 4 flashcards for a quiz. Upload more notes first.",
    });
  }

  const pool = shuffle(cards).slice(0, 10);

  const questions = pool.map((card) => {
    const wrongAnswers = shuffle(
      cards.filter((c) => c.id !== card.id).map((c) => c.answer)
    ).slice(0, 3);

    return {
      id: card.id,
      conceptId: card.conceptId,
      question: card.question,
      correctAnswer: card.answer,
      options: shuffle([card.answer, ...wrongAnswers]),
    };
  });

  res.status(200).json({ questions });
}
