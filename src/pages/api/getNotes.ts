import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const flashcards = await prisma.flashcard.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
    });

    const notes = await prisma.notes.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({
      flashcards,
      notes,
    });
  } catch (error) {
    console.error("getNotes error:", error);
    return res.status(500).json({ error: "Failed to fetch notes" });
  }
}
