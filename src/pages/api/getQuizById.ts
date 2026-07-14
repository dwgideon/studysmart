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

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid quiz id" });
  }

  try {
    const quiz = await prisma.savedQuiz.findFirst({
      where: { id, userId: user.id },
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    return res.status(200).json(quiz);
  } catch (error) {
    console.error("getQuizById error:", error);
    return res.status(500).json({ error: "Failed to fetch quiz" });
  }
}
