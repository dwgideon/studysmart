// src/pages/api/getNotes.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const flashcards = await prisma.flashcard.findMany({ take: 5, orderBy: { createdAt: "desc" } });
    const quizzes = await prisma.quiz.findMany({
      take: 5,
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });
    const notes = await prisma.note.findMany({ take: 5, orderBy: { createdAt: "desc" } });

    res.json({ flashcards, quizzes, notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}