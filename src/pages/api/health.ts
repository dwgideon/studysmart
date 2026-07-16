import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const startedAt = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("health timeout")), 3_000)),
    ]);
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return res.status(503).json({
      status: "unavailable",
      timestamp: new Date().toISOString(),
      requestId: res.getHeader("X-Request-ID") ?? null,
    });
  }
}
