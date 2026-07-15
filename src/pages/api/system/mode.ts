import type { NextApiRequest, NextApiResponse } from "next";
import { isAiFreeTestMode } from "@/lib/aiFreeTestMode";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).end();}
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    aiFreeTestMode: isAiFreeTestMode,
    label: isAiFreeTestMode ? "AI-free test mode" : "Live AI mode",
    paidAiCallsEnabled: !isAiFreeTestMode,
  });
}
