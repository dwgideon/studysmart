import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generateFlashcardsFromText } from "@/lib/aiHelpers";
import formidable from "formidable";

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

  const form = formidable();

  form.parse(req, async (err: any, fields: Record<string, any>) => {
  if (err) {
    console.error("Form parse error:", err);
    return res.status(500).json({ error: "Failed to parse form" });
  }

  const content = fields.text;
  const userId = fields.userId;

  if (!content || !userId) {
    return res.status(400).json({ error: "Missing content or userId" });
  }

  // continue logic...
});


    try {
      // 1️⃣ Create Study Session
      const session = await prisma.studySession.create({
  data: {
    userId,
  },
});

await prisma.flashcard.createMany({
  data: flashcards.map((card: any) => ({
    question: card.front,
    answer: card.back,
    userId,
    sessionId: session.id,
  })),
});


      // 4️⃣ Return sessionId
      return res.status(200).json({ sessionId: session.id });
    } catch (error) {
      console.error("Generation error:", error);
      return res.status(500).json({ error: "Generation failed" });
    }
  });
}
