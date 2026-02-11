import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generateFlashcardsFromText } from "@/lib/aiHelpers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { content, userId } = req.body;
  if (!content || !userId) {
    return res.status(400).json({ error: "Missing content or userId" });
  }

  try {
    const flashcards = await generateFlashcardsFromText(content);

    await prisma.flashcard.createMany({
      data: flashcards.map((card) => ({
        question: card.front,
        answer: card.back,
        user_id: userId,
      })),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to generate flashcards" });
  }
}
