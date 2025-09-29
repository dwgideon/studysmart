import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "UserId required" });

  try {
    const flashcards = await prisma.flashcard.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(flashcards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch flashcards" });
  }
}
