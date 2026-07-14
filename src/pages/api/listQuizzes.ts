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
    const quizzes = await prisma.savedQuiz.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        score: true,
        total: true,
        createdAt: true,
      },
    });

    return res.status(200).json(quizzes);
  } catch (error) {
    console.error("listQuizzes error:", error);
    return res.status(500).json({ error: "Failed to list quizzes" });
  }
}
