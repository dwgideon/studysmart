import type { NextApiRequest, NextApiResponse } from "next";
import {
  aggregateAiMetrics,
  runLocalSafetyEval,
} from "@/lib/aiObservability";
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
  const { evaluation, aggregation } = await runOperationalJob(
    "ai-evaluation",
    requestIdFromHeaders(req.headers),
    async () => {
      const [evaluation, aggregation] = await Promise.all([
        runLocalSafetyEval(),
        aggregateAiMetrics(),
      ]);
      return { evaluation, aggregation };
    }
  );
  return res.status(evaluation.status === "PASSED" ? 200 : 503).json({
    ok: evaluation.status === "PASSED",
    evaluation: {
      id: evaluation.id,
      status: evaluation.status,
      summary: evaluation.summary,
    },
    aggregation,
  });
}
