import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid quiz id" });
  }

  try {
    const topic = await prisma.topics.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        quiz: true,
        created_at: true,
      },
    });

    if (!topic || !topic.quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    return res.status(200).json(topic);
  } catch (error) {
    console.error("getQuizById error:", error);
    return res.status(500).json({ error: "Failed to fetch quiz" });
  }
}
