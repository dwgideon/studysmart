import type { NextApiRequest, NextApiResponse } from "next";
import { collectOperationalStatus, secureBearerMatches } from "@/lib/operations";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const header = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const expected = process.env.OPS_HEALTH_TOKEN ?? process.env.CRON_SECRET;
  if (!secureBearerMatches(header, expected)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const status = await collectOperationalStatus();
  return res.status(status.status === "healthy" ? 200 : 503).json(status);
}
