import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { companionById } from "@/lib/learningCompanions";
import { gradeBandFor } from "@/lib/learningProfile";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {return res.status(405).end();}
  const user = await requireApiUser(req, res);
  if (!user) {return;}

  const companion = companionById(String(req.body?.companionId || ""));
  const readAloud = req.body?.readAloud;
  const requestedRate = Number(req.body?.speechRate);
  if (!companion) {return res.status(400).json({ error: "Choose an available learning companion." });}
  if (typeof readAloud !== "boolean") {return res.status(400).json({ error: "Choose whether your companion should read aloud." });}
  const speechRate = Number.isFinite(requestedRate) ? Math.max(0.7, Math.min(1.1, requestedRate)) : 0.9;
  const learner = await prisma.learnerProfile.findUnique({ where: { userId: user.id }, select: { gradeLevel: true } });
  const gradeBand = gradeBandFor(learner?.gradeLevel ?? "6");
  const elementaryExperience = gradeBand === "EARLY" || gradeBand === "ELEMENTARY";
  if (companion.elementary !== elementaryExperience) {return res.status(400).json({ error: "Choose a companion designed for your learning experience." });}

  const profile = await prisma.gameProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, companionId: companion.id, readAloud, speechRate },
    update: { companionId: companion.id, readAloud, speechRate },
    select: { companionId: true, readAloud: true, speechRate: true },
  });
  return res.status(200).json({ companion: profile });
}
