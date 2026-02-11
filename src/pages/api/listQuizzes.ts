import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).end();
  }

  try {
    const quizzes = await prisma.topics.findMany({
      where: { user_id: session.user.id },
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
    console.error("listQuizzes error:", error);
    return res.status(500).json({ error: "Failed to list quizzes" });
  }
}
