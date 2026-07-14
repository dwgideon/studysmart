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

  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        flashcards: { take: 1, orderBy: { createdAt: "asc" } },
      },
    });

    const data = sessions.map((s) => ({
      id: s.id,
      topic:
        s.title ??
        s.flashcards[0]?.question?.slice(0, 72) ??
        "Study session",
      score: s.correct,
      total: s.totalCards,
      accuracy:
        s.totalCards > 0
          ? Math.round((s.correct / s.totalCards) * 100)
          : 0,
      completed: s.completed,
      created_at: s.createdAt.toISOString(),
    }));

    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to fetch study sessions:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}
