// src/pages/api/xp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const DEMO_USER_ID = "demo-user"; // replace with auth later

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const record = await prisma.leaderboard.findFirst({
      where: { user_id: DEMO_USER_ID },
    });

    return res.json({ xp: record?.score ?? 0 });
  }

  if (req.method === "POST") {
    const { amount } = req.body;

    const existing = await prisma.leaderboard.findFirst({
      where: { user_id: DEMO_USER_ID },
    });

    if (existing) {
      await prisma.leaderboard.update({
        where: { id: existing.id }, // ✅ unique
        data: {
          score: { increment: amount },
        },
      });
    } else {
      await prisma.leaderboard.create({
        data: {
          user_id: DEMO_USER_ID,
          score: amount,
        },
      });
    }

    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
