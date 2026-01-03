// pages/api/study/stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getStudyStreak } from "@/lib/streaks";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = "demo-user"; // TEMP until auth wiring

  const streak = await getStudyStreak(userId);

  res.status(200).json({ streak });
}
