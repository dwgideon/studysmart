import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).end();}
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}

  const [user, profile, settings, courses, sessions, masteries, quizzes, notes, sources, conversations, consents, organizationMemberships, experimentAssignments, experimentEvents, aiTraces, safetyEvents, auditEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true, name: true, accountRole: true, ageGroup: true, xp: true, plan: true, createdAt: true },
    }),
    prisma.learnerProfile.findUnique({ where: { userId: authUser.id } }),
    prisma.privacySettings.findUnique({ where: { userId: authUser.id } }),
    prisma.course.findMany({ where: { userId: authUser.id } }),
    prisma.studySession.findMany({ where: { userId: authUser.id }, include: { cardReviews: true } }),
    prisma.conceptMastery.findMany({ where: { userId: authUser.id }, include: { concept: true } }),
    prisma.savedQuiz.findMany({ where: { userId: authUser.id } }),
    prisma.note.findMany({ where: { userId: authUser.id } }),
    prisma.sourceMaterial.findMany({ where: { userId: authUser.id } }),
    prisma.tutorConversation.findMany({ where: { userId: authUser.id }, include: { messages: true } }),
    prisma.consentRecord.findMany({ where: { OR: [{ subjectUserId: authUser.id }, { grantedByUserId: authUser.id }] } }),
    prisma.organizationMembership.findMany({
      where: { userId: authUser.id },
      include: { organization: { select: { id: true, name: true, status: true } } },
    }),
    prisma.experimentAssignment.findMany({ where: { userId: authUser.id } }),
    prisma.experimentEvent.findMany({ where: { userId: authUser.id } }),
    prisma.aiInteractionTrace.findMany({ where: { userId: authUser.id } }),
    prisma.safetyEvent.findMany({ where: { userId: authUser.id } }),
    prisma.auditEvent.findMany({ where: { OR: [{ actorUserId: authUser.id }, { subjectId: authUser.id }] }, orderBy: { createdAt: "desc" } }),
  ]);

  await prisma.auditEvent.create({
    data: { actorUserId: authUser.id, subjectId: authUser.id, action: "DATA_EXPORTED", resourceType: "User", resourceId: authUser.id },
  });
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="studysmart-data-${new Date().toISOString().slice(0, 10)}.json"`);
  return res.status(200).json({
    exportedAt: new Date().toISOString(),
    user, profile, privacySettings: settings, courses, sessions, masteries,
    quizzes, notes, sources, tutorConversations: conversations, consents,
    organizationMemberships, experimentAssignments, experimentEvents,
    aiInteractionTraces: aiTraces, safetyEvents, auditEvents,
  });
}

export default withApiMonitoring("api.privacy.export", handler);
