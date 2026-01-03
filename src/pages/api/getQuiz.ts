// pages/api/getQuiz.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  const userId = (session?.user as { id: string })?.id;
  if (!userId) return res.status(401).end();

  try {
    const quizzes = await prisma.savedQuiz.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
}
