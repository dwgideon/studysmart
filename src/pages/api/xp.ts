import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser, getApiUser } from "@/lib/auth";
import { awardXp, getUserXp } from "@/lib/xp";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const user = await getApiUser(req, res);
    if (!user) {
      return res.json({ xp: 0, level: 1 });
    }
    const xp = await getUserXp(user.id);
    return res.json({ xp, level: Math.floor(xp / 100) + 1 });
  }

  if (req.method === "POST") {
    const user = await requireApiUser(req, res);
    if (!user) {return;}

    const { amount } = req.body as { amount?: number };
    const xp = await awardXp(user.id, amount ?? 0);
    return res.status(200).json({ ok: true, xp, level: Math.floor(xp / 100) + 1 });
  }

  res.status(405).end();
}
