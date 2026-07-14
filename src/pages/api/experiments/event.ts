import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/auth";
import {
  EXPERIMENT_EVENT_NAMES,
  recordExperimentEvent,
} from "@/lib/experiments";
import { cleanText } from "@/lib/learningProfile";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const experimentKey = cleanText(req.body?.experimentKey, 80);
  const eventName = cleanText(req.body?.eventName, 60).toUpperCase();
  if (!experimentKey || !EXPERIMENT_EVENT_NAMES.has(eventName)) {
    return res.status(400).json({ error: "Invalid experiment event." });
  }
  const value = typeof req.body?.value === "number" && Number.isFinite(req.body.value)
    ? Math.max(-1_000_000, Math.min(1_000_000, req.body.value))
    : undefined;
  const metadata = req.body?.metadata && typeof req.body.metadata === "object"
    ? JSON.parse(JSON.stringify(req.body.metadata).slice(0, 2_000)) as Prisma.InputJsonValue
    : undefined;
  const event = await recordExperimentEvent({
    userId: user.id,
    experimentKey,
    eventName,
    value,
    metadata,
  });
  return res.status(event ? 201 : 204).json(event ? { recorded: true } : undefined);
}
