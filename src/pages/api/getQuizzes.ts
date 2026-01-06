import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Missing or invalid userId" });
  }

  try {
    const quizzes = await prisma.topics.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        title: true,
        quiz: true,
        created_at: true,
      },
    });

    return res.status(200).json(quizzes);
  } catch (error) {
    console.error("getQuizzes error:", error);
    return res.status(500).json({ error: "Failed to fetch quizzes" });
  }
}
