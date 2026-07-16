import type { NextApiRequest, NextApiResponse } from "next";
import { getApiUser } from "@/lib/auth";
import { getUserXp } from "@/lib/xp";

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

  res.setHeader("Allow", "GET");
  return res.status(405).json({ error: "XP is awarded only by verified learning activity." });
}
