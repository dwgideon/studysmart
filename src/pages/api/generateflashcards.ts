// pages/api/generateFlashcards.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
// Update the import path below to the correct relative path if needed
import { authOptions } from "../../lib/auth"; // Adjust the path if your auth file is elsewhere
import { prisma } from "@/lib/prisma";
import { generateFlashcardsFromText } from "@/lib/aiHelpers";

const MAX_TOKENS = 50000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  // Extend the user type to include 'id'
  type SessionUserWithId = typeof session & { user: { id: string } };
  const sessionWithId = session as SessionUserWithId;
  if (!sessionWithId?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Missing content" });

  const userId = sessionWithId.user.id;

  // Check usage
  const usage = await prisma.tokenLog.aggregate({
    where: { userId },
    _sum: { tokensUsed: true },
  });

  const tokensUsed = usage._sum.tokensUsed ?? 0;
  if (tokensUsed >= MAX_TOKENS) {
    return res.status(403).json({ error: "Token limit exceeded" });
  }

  try {
    const flashcards = await generateFlashcardsFromText(content);

    await prisma.$transaction([
      ...flashcards.map((card: any) =>
        prisma.flashcard.create({
          data: {
            question: card.front,
            answer: card.back,
            userId,
          },
        })
      ),
      prisma.tokenLog.create({
        data: {
          userId,
          tokensUsed: 1000, // optionally set to actual value from OpenAI response
        },
      }),
    ]);

    return res.status(200).json({ success: true, flashcards });
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
