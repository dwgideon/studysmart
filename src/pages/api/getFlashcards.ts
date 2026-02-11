import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const cards = await prisma.flashcard.findMany({
    orderBy: {
      created_at: "desc", // ✅ this field EXISTS
    },
    take: 20,
  });

  res.status(200).json({ flashcards: cards });
}
