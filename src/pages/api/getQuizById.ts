// pages/api/getQuizById.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const { id } = req.query;

  const quiz = await prisma.savedQuiz.findUnique({
    where: { id: id as string },
  });

  if (!quiz || quiz.userId !== session.user.id)
    return res.status(403).json({ error: "Not authorized" });

  res.status(200).json(quiz);
}
