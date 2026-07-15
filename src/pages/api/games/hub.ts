import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { AVATAR_CATALOG, STARTER_ITEMS, levelForXp } from "@/lib/gameEconomy";

const safeDisplayName = (name: string | null) => {
  if (!name || /^[0-9a-f-]{30,}$/i.test(name)) {return "Learner";}
  return name.trim().split(/\s+/)[0].slice(0, 20) || "Learner";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).end();}
  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const [account, profile, owned, recentRuns, leaders] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, xp: true } }),
    prisma.gameProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} }),
    prisma.avatarItemOwnership.findMany({ where: { userId: user.id }, select: { itemId: true } }),
    prisma.gameRun.findMany({ where: { userId: user.id, completedAt: { not: null } }, orderBy: { completedAt: "desc" }, take: 5, select: { id: true, mode: true, project: true, score: true, xpEarned: true, sparksEarned: true, completedAt: true } }),
    prisma.user.findMany({ where: { accountRole: "STUDENT" }, orderBy: { xp: "desc" }, take: 5, select: { id: true, name: true, xp: true } }),
  ]);

  return res.status(200).json({
    player: { name: safeDisplayName(account.name), xp: account.xp, level: levelForXp(account.xp), sparks: profile.sparks },
    avatar: { hair: profile.equippedHair, top: profile.equippedTop, extra: profile.equippedExtra },
    owned: [...STARTER_ITEMS, ...owned.map((item) => item.itemId)],
    catalog: AVATAR_CATALOG,
    recentRuns,
    leaderboard: leaders.map((leader, index) => ({ rank: index + 1, name: leader.id === user.id ? "You" : safeDisplayName(leader.name), xp: leader.xp })),
  });
}
