import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { requireApiUser } from "@/lib/auth";
import { normalizeMobileDeviceRegistration } from "@/lib/mobileDevice";
import { databaseTransaction, prisma } from "@/lib/prisma";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}

  const header = req.headers["x-installation-id"];
  const installationId = Array.isArray(header) ? header[0] : header;

  if (req.method === "GET") {
    const device = installationId
      ? await prisma.mobileDevice.findFirst({
          where: { userId: authUser.id, installationId, active: true },
          select: { platform: true, pushToken: true, appVersion: true, lastSeenAt: true },
        })
      : null;
    return res.status(200).json({
      registered: Boolean(device),
      pushEnabled: Boolean(device?.pushToken),
      device,
    });
  }

  if (req.method === "DELETE") {
    if (!installationId || !/^[A-Za-z0-9_-]{16,128}$/.test(installationId)) {
      return res.status(400).json({ error: "A valid installation identifier is required." });
    }
    await prisma.$transaction([
      prisma.mobileDevice.updateMany({
        where: { userId: authUser.id, installationId },
        data: { active: false, pushToken: null, lastSeenAt: new Date() },
      }),
      prisma.auditEvent.create({
        data: {
          actorUserId: authUser.id,
          subjectId: authUser.id,
          action: "MOBILE_DEVICE_REVOKED",
          resourceType: "MobileDevice",
        },
      }),
    ]);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const registration = normalizeMobileDeviceRegistration(req.body);
  if (!registration) {
    return res.status(400).json({ error: "Invalid mobile device registration." });
  }
  const account = await prisma.user.findUniqueOrThrow({
    where: { id: authUser.id },
    select: { accountRole: true },
  });
  const now = new Date();
  const device = await databaseTransaction(async (tx) => {
    const saved = await tx.mobileDevice.upsert({
      where: { installationId: registration.installationId },
      create: {
        userId: authUser.id,
        ...registration,
        pushToken: registration.pushToken ?? null,
        active: true,
        lastSeenAt: now,
      },
      update: {
        userId: authUser.id,
        platform: registration.platform,
        ...(registration.pushToken !== undefined ? { pushToken: registration.pushToken } : {}),
        appVersion: registration.appVersion,
        active: true,
        lastSeenAt: now,
      },
    });
    if (registration.pushToken && ["GUARDIAN", "TEACHER"].includes(account.accountRole)) {
      await tx.safetyContactPreference.upsert({
        where: { userId: authUser.id },
        create: { userId: authUser.id, pushEnabled: true },
        update: { pushEnabled: true },
      });
      const pending = await tx.safetyNotification.findMany({
        where: {
          recipientUserId: authUser.id,
          responseStatus: "UNACKNOWLEDGED",
          createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true, escalationLevel: true },
        take: 20,
      });
      await tx.safetyDelivery.createMany({
        data: pending.map((notification) => ({
          notificationId: notification.id,
          channel: "MOBILE_PUSH",
          escalationLevel: notification.escalationLevel,
        })),
        skipDuplicates: true,
      });
    }
    await tx.auditEvent.create({
      data: {
        actorUserId: authUser.id,
        subjectId: authUser.id,
        action: "MOBILE_DEVICE_REGISTERED",
        resourceType: "MobileDevice",
        resourceId: saved.id,
        metadata: {
          platform: registration.platform,
          pushEnabled: Boolean(registration.pushToken),
        },
      },
    });
    return saved;
  });
  return res.status(200).json({
    ok: true,
    device: {
      id: device.id,
      platform: device.platform,
      pushEnabled: Boolean(device.pushToken),
      lastSeenAt: device.lastSeenAt,
    },
  });
}

export default withApiMonitoring("api.mobile.device", handler);
