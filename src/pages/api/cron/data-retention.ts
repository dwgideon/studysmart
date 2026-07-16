import type { NextApiRequest, NextApiResponse } from "next";
import { enforceDataRetention } from "@/lib/dataRetention";
import { requestIdFromHeaders, runOperationalJob, secureBearerMatches } from "@/lib/operations";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.CRON_SECRET;
  const authorization = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  if (!secureBearerMatches(authorization, secret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const summary = await runOperationalJob("data-retention", requestIdFromHeaders(req.headers), enforceDataRetention);
  return res.status(200).json({ ok: true, ...summary });
}
