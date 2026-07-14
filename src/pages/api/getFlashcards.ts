import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const cards = await prisma.flashcard.findMany({
      where: {
        sessionId: sessionId as string,
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({ flashcards: cards });
  } catch (error) {
    console.error("Fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch flashcards" });
  }
}
