import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "UserId required" });

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { userId: String(userId) },
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
}
