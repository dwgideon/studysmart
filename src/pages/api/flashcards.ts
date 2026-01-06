import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { questions, userId } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: "Missing questions array" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const cards = await prisma.flashcard.createMany({
      data: questions.map((q: QuizQuestion) => ({
        question: q.question,
        answer: `${q.options[q.answer]} — ${q.explanation}`,
        user_id: userId, // ✅ FIXED
      })),
    });

    return res.status(200).json({
      success: true,
      count: cards.count,
    });
  } catch (err) {
    console.error("Flashcard save error:", err);

    return res.status(500).json({
      error: "Failed to save flashcards",
    });
  }
}
