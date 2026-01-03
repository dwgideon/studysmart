import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TEMP: replace later with real auth user
  const userId = "demo-user";

  const streak = await prisma.study_streaks.findFirst({
    where: { user_id: userId },
  });

  return res.status(200).json({
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    lastStudyDate: streak?.last_study_date ?? null,
  });
}
