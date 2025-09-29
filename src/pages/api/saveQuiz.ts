import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, questions, userId } = req.body;

  if (!userId || !title || !questions?.length) {
    return res.status(400).json({ error: "Missing quiz data or userId" });
  }

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title,
        userId,
        questions: {
          create: questions.map(
            (q: { question: string; answer: string; options: string[] }) => ({
              question: q.question,
              answer: q.answer,
              options: q.options, // ✅ stored as JSON
            })
          ),
        },
      },
      include: { questions: true },
    });

    res.status(200).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save quiz" });
  }
}
