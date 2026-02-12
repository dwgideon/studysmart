import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import formidable from "formidable";
import { generateFlashcardsFromText } from "@/lib/aiHelpers";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const sessionId = randomUUID();

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "File parse error" });
    }

    const content = fields.text as string;

    if (!content) {
      return res.status(400).json({ error: "No content provided" });
    }

    try {
      const flashcards = await generateFlashcardsFromText(content);

      await prisma.flashcard.createMany({
        data: flashcards.map((card) => ({
          question: card.front,
          answer: card.back,
          session_id: sessionId, // 🔥 IMPORTANT
        })),
      });

      return res.status(200).json({ sessionId });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Generation failed" });
    }
  });
}
