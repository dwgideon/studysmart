import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: Replace with real authenticated user
  const userId = "demo-user";

  try {
    const streak = await prisma.studyStreak.findUnique({
      where: { userId },
    });

    return res.status(200).json({
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      lastStudyDate: streak?.lastStudyDate ?? null,
    });
  } catch (error) {
    console.error("Streak fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch streak" });
  }
}
