import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const cards = await prisma.flashcard.findMany({
    where: {
      session_id: sessionId as string,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  res.status(200).json({ flashcards: cards });
}
