import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const user = await requireApiUser(req, res);
  if (!user) {
    return;
  }

  try {
    const cards = await prisma.flashcard.findMany({
      where: { userId: user.id, nextReviewAt: { lte: new Date() } },
      orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
      take: 20,
      include: { concept: { select: { courseId: true } } },
    });

    if (cards.length === 0) {
      return res.status(400).json({
        error: "No cards are due right now. Check back after your next review time.",
      });
    }

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        courseId: cards.find((card) => card.concept)?.concept?.courseId ?? null,
        title: cards[0]?.question.slice(0, 72) ?? "Study session",
        totalCards: cards.length,
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      cards,
    });
  } catch (error) {
    console.error("study/start error:", error);
    return res.status(500).json({ error: "Failed to start study session" });
  }
}

export default withApiMonitoring("api.study.start", handler);
