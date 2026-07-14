import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { decryptSafetyAttempt } from "@/lib/childSafety";
import { prisma } from "@/lib/prisma";

async function authorizedLearners(
  userId: string,
  role: string,
  verificationStatus: string,
  learnerIds: string[]
) {
  if (role === "GUARDIAN") {
    const links = await prisma.guardianStudent.findMany({
      where: {
        guardianId: userId,
        studentId: { in: learnerIds },
        status: "ACTIVE",
      },
      select: { studentId: true },
    });
    return new Set(links.map((link) => link.studentId));
  }
  if (
    role === "TEACHER" &&
    ["VERIFIED", "DOMAIN_VERIFIED"].includes(verificationStatus)
  ) {
    const links = await prisma.classroomMembership.findMany({
      where: {
        studentId: { in: learnerIds },
        status: "ACTIVE",
        classroom: { teacherId: userId, archivedAt: null },
      },
      select: { studentId: true },
    });
    return new Set(links.map((link) => link.studentId));
  }
  return new Set<string>();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const recipient = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { accountRole: true, roleVerificationStatus: true },
  });
  if (!recipient || !["GUARDIAN", "TEACHER"].includes(recipient.accountRole)) {
    return res.status(403).json({ error: "Authorized adult role required." });
  }

  if (req.method === "POST") {
    const action = req.body?.action;
    if (
      !["mark-reviewed", "acknowledge-response", "reveal"].includes(action) ||
      typeof req.body?.notificationId !== "string"
    ) {
      return res.status(400).json({ error: "Invalid review action." });
    }
    const notification = await prisma.safetyNotification.findFirst({
      where: { id: req.body.notificationId, recipientUserId: authUser.id },
      include: { violation: { select: { userId: true } } },
    });
    if (!notification) {return res.status(404).json({ error: "Safety alert not found." });}
    const allowed = await authorizedLearners(
      authUser.id,
      recipient.accountRole,
      recipient.roleVerificationStatus,
      [notification.violation.userId]
    );
    if (!allowed.has(notification.violation.userId)) {
      return res.status(403).json({ error: "You no longer have access to this learner alert." });
    }
    const now = new Date();
    if (action === "reveal") {
      const lastSignIn = authUser.last_sign_in_at
        ? new Date(authUser.last_sign_in_at)
        : null;
      if (!lastSignIn || now.getTime() - lastSignIn.getTime() > 15 * 60_000) {
        return res.status(428).json({
          code: "RECENT_SIGN_IN_REQUIRED",
          error: "Sign out and sign back in before viewing this sensitive alert.",
        });
      }
      const violation = await prisma.safetyViolation.findUniqueOrThrow({
        where: { id: notification.violationId },
      });
      const exactAttempt = decryptSafetyAttempt(violation);
      if (!exactAttempt) {
        return res.status(410).json({
          code: "SAFETY_DETAIL_EXPIRED",
          error: "The encrypted request detail has reached its retention limit and was securely purged.",
        });
      }
      await prisma.$transaction([
        prisma.safetyNotification.update({
          where: { id: notification.id },
          data: { readAt: notification.readAt ?? now },
        }),
        prisma.auditEvent.create({
          data: {
            actorUserId: authUser.id,
            subjectId: notification.violation.userId,
            action: "SAFETY_ATTEMPT_REVEALED_AFTER_REAUTH",
            resourceType: "SafetyNotification",
            resourceId: notification.id,
          },
        }),
      ]);
      return res.status(200).json({
        ok: true,
        exactAttempt,
        readAt: notification.readAt?.toISOString() ?? now.toISOString(),
      });
    }

    if (action === "acknowledge-response") {
      await prisma.$transaction([
        prisma.safetyNotification.updateMany({
          where: { violationId: notification.violationId },
          data: {
            acknowledgedAt: now,
            acknowledgedByUserId: authUser.id,
            responseStatus: "RESPONDING",
          },
        }),
        prisma.auditEvent.create({
          data: {
            actorUserId: authUser.id,
            subjectId: notification.violation.userId,
            action: "SAFETY_RESPONSE_ACKNOWLEDGED",
            resourceType: "SafetyNotification",
            resourceId: notification.id,
          },
        }),
      ]);
      return res.status(200).json({ ok: true, acknowledgedAt: now.toISOString() });
    }

    await prisma.$transaction([
      prisma.safetyNotification.update({
        where: { id: notification.id },
        data: { readAt: notification.readAt ?? now },
      }),
      prisma.auditEvent.create({
        data: {
          actorUserId: authUser.id,
          subjectId: notification.violation.userId,
          action: "SAFETY_NOTIFICATION_REVIEWED",
          resourceType: "SafetyNotification",
          resourceId: notification.id,
        },
      }),
    ]);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const notifications = await prisma.safetyNotification.findMany({
    where: { recipientUserId: authUser.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      violation: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      deliveries: {
        select: { channel: true, status: true, escalationLevel: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  const learnerIds = [...new Set(notifications.map((item) => item.violation.userId))];
  const allowed = await authorizedLearners(
    authUser.id,
    recipient.accountRole,
    recipient.roleVerificationStatus,
    learnerIds
  );
  const visible = notifications.filter((item) => allowed.has(item.violation.userId));
  const alerts = visible.map((item) => ({
    id: item.id,
    learner: item.violation.user,
    category: item.violation.category,
    source: item.violation.source,
    attemptNumber: item.violation.attemptNumber,
    lockedUntil: item.violation.lockoutUntil?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
    acknowledgedAt: item.acknowledgedAt?.toISOString() ?? null,
    responseStatus: item.responseStatus,
    escalationLevel: item.escalationLevel,
    deliveries: item.deliveries,
  }));
  return res.status(200).json({
    alerts,
    unreadCount: alerts.filter((alert) => !alert.readAt).length,
  });
}
