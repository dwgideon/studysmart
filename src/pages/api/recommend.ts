// src/pages/api/recommend.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generateStudyRecommendation } from "@/lib/aiHelpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Temporary: in production, get actual logged-in user from Supabase Auth
    const userId = "test-user";

    // Find the user's most recent activity (Note, Quiz, or Flashcard)
    const [lastNote, lastQuiz, lastFlashcard] = await Promise.all([
      prisma.note.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.quiz.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.flashcard.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);

    // Choose whichever was most recent
    const recent = [lastNote, lastQuiz, lastFlashcard]
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

    const topic =
      recent && "title" in recent
        ? recent.title
        : recent && "front" in recent
        ? recent.front
        : null;

    const recommendation = await generateStudyRecommendation(topic);

    return res.status(200).json({
      success: true,
      topic: topic || "General Study",
      recommendation,
    });
  } catch (err: any) {
    console.error("AI recommend error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to generate recommendation",
    });
  }
}
