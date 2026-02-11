// pages/api/saveQuiz.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const { topic, type, questions, answers, score } = req.body;

  try {
    const saved = await prisma.savedQuiz.create({
      data: {
        userId: session.user.id,
        topic,
        type,
        questions,
        answers,
        score,
      },
    });

    res.status(200).json({ success: true, quizId: saved.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save quiz" });
  }
}
