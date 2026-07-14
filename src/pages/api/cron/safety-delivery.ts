import type { NextApiRequest, NextApiResponse } from "next";
import { processSafetyDeliveries } from "@/lib/safetyDelivery";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const summary = await processSafetyDeliveries();
  return res.status(200).json({ ok: true, ...summary });
}
