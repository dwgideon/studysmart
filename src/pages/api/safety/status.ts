import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let account = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      accountRole: true,
      safetyStrikeCount: true,
      learningLockedUntil: true,
    },
  });
  if (!account) {return res.status(404).json({ error: "Account not found." });}

  const now = new Date();
  if (account.learningLockedUntil && account.learningLockedUntil <= now) {
    account = await prisma.user.update({
      where: { id: authUser.id },
      data: { safetyStrikeCount: 0, learningLockedUntil: null },
      select: {
        accountRole: true,
        safetyStrikeCount: true,
        learningLockedUntil: true,
      },
    });
  }

  if (req.method === "POST") {
    if (req.body?.action !== "appeal") {
      return res.status(400).json({ error: "Unknown action." });
    }
    if (account.accountRole !== "STUDENT") {
      return res.status(403).json({ error: "Only a learner can appeal their lock." });
    }
    const violation = await prisma.safetyViolation.findFirst({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
    });
    if (!violation) {
      return res.status(404).json({ error: "No safety decision is available to appeal." });
    }
    const request = await prisma.$transaction(async (tx) => {
      const existing = await tx.dataRightsRequest.findFirst({
        where: {
          userId: authUser.id,
          requestType: "SAFETY_APPEAL",
          status: "OPEN",
        },
      });
      const rightsRequest = existing ?? await tx.dataRightsRequest.create({
        data: { userId: authUser.id, requestType: "SAFETY_APPEAL" },
      });
      await Promise.all([
        tx.safetyViolation.update({
          where: { id: violation.id },
          data: { appealedAt: new Date() },
        }),
        tx.auditEvent.create({
          data: {
            actorUserId: authUser.id,
            subjectId: authUser.id,
            action: "SAFETY_LOCK_APPEALED",
            resourceType: "SafetyViolation",
            resourceId: violation.id,
          },
        }),
      ]);
      return rightsRequest;
    });
    return res.status(201).json({ ok: true, requestId: request.id });
  }

  const locked = Boolean(
    account.learningLockedUntil && account.learningLockedUntil > now
  );
  return res.status(200).json({
    locked,
    strikeCount: account.safetyStrikeCount,
    lockedUntil: account.learningLockedUntil?.toISOString() ?? null,
  });
}
