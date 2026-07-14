import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }
  const user = await requireApiUser(req, res);
  if (!user) {
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [dueNow, dueTomorrow, nextCard, profile] = await Promise.all([
    prisma.flashcard.count({ where: { userId: user.id, nextReviewAt: { lte: now } } }),
    prisma.flashcard.count({
      where: { userId: user.id, nextReviewAt: { gt: now, lte: tomorrow } },
    }),
    prisma.flashcard.findFirst({
      where: { userId: user.id, nextReviewAt: { gt: now } },
      orderBy: { nextReviewAt: "asc" },
      select: { nextReviewAt: true },
    }),
    prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      select: { dailyReviewLimit: true },
    }),
  ]);

  return res.status(200).json({
    dueNow,
    dueTomorrow,
    dailyLimit: profile?.dailyReviewLimit ?? 20,
    nextReviewAt: nextCard?.nextReviewAt.toISOString() ?? null,
  });
}
