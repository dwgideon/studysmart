import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { awardXp } from "@/lib/xp";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const top = await prisma.user.findMany({
      orderBy: { xp: "desc" },
      take: 10,
      select: { name: true, email: true, xp: true },
    });

    return res.status(200).json({
      leaderboard: top.map((u, i) => ({
        rank: i + 1,
        username: u.name ?? u.email.split("@")[0],
        score: u.xp,
      })),
    });
  }

  if (req.method === "POST") {
    const user = await requireApiUser(req, res);
    if (!user) {return;}

    const { score } = req.body as { score?: number };
    const xpGain = Math.max(5, (score ?? 0) * 5);
    const xp = await awardXp(user.id, xpGain);

    return res.status(200).json({ ok: true, xpGain, xp });
  }

  res.status(405).end();
}
