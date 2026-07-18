import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSensitiveValue } from "@/lib/sensitiveEncryption";

const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { accountRole: true },
  });
  if (!user || user.accountRole !== "GUARDIAN") {
    return res.status(403).json({ error: "Parent or guardian role required." });
  }

  if (req.method === "GET") {
    const [preference, pushSubscriptions, mobileDevices] = await Promise.all([
      prisma.safetyContactPreference.upsert({
        where: { userId: authUser.id },
        create: { userId: authUser.id },
        update: {},
      }),
      prisma.pushSubscription.count({
        where: { userId: authUser.id, active: true },
      }),
      prisma.mobileDevice.count({
        where: { userId: authUser.id, active: true, pushToken: { not: null } },
      }),
    ]);
    return res.status(200).json({
      emailEnabled: preference.emailEnabled,
      smsEnabled: preference.smsEnabled,
      pushEnabled: preference.pushEnabled,
      hasPhone: Boolean(preference.phoneCiphertext),
      hasPushSubscription: pushSubscriptions > 0 || mobileDevices > 0,
      hasMobileDevice: mobileDevices > 0,
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = typeof req.body?.action === "string" ? req.body.action : "update";
  if (action === "subscribe-push") {
    const subscription = req.body?.subscription;
    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      typeof subscription.keys?.p256dh !== "string" ||
      typeof subscription.keys?.auth !== "string"
    ) {
      return res.status(400).json({ error: "Invalid push subscription." });
    }
    await prisma.$transaction([
      prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        create: {
          userId: authUser.id,
          endpoint: subscription.endpoint.slice(0, 2000),
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        update: {
          userId: authUser.id,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          active: true,
        },
      }),
      prisma.safetyContactPreference.upsert({
        where: { userId: authUser.id },
        create: { userId: authUser.id, pushEnabled: true },
        update: { pushEnabled: true },
      }),
      prisma.auditEvent.create({
        data: {
          actorUserId: authUser.id,
          subjectId: authUser.id,
          action: "SAFETY_PUSH_ENABLED",
          resourceType: "SafetyContactPreference",
        },
      }),
    ]);
    return res.status(200).json({ ok: true });
  }

  if (action === "disable-push") {
    await prisma.$transaction([
      prisma.pushSubscription.updateMany({
        where: { userId: authUser.id },
        data: { active: false },
      }),
      prisma.safetyContactPreference.upsert({
        where: { userId: authUser.id },
        create: { userId: authUser.id, pushEnabled: false },
        update: { pushEnabled: false },
      }),
    ]);
    return res.status(200).json({ ok: true });
  }

  const emailEnabled = req.body?.emailEnabled !== false;
  const smsEnabled = req.body?.smsEnabled === true;
  const phone = typeof req.body?.phone === "string"
    ? req.body.phone.replace(/[\s().-]/g, "")
    : "";
  if (smsEnabled && !phone && req.body?.hasPhone !== true) {
    return res.status(400).json({ error: "Enter a mobile number to enable SMS." });
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    return res.status(400).json({
      error: "Use international format, such as +15551234567.",
    });
  }
  const encrypted = phone ? encryptSensitiveValue(phone) : null;
  await prisma.$transaction([
    prisma.safetyContactPreference.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        emailEnabled,
        smsEnabled,
        ...(encrypted ? {
          phoneCiphertext: encrypted.ciphertext,
          phoneIv: encrypted.iv,
          phoneAuthTag: encrypted.authTag,
        } : {}),
      },
      update: {
        emailEnabled,
        smsEnabled,
        ...(encrypted ? {
          phoneCiphertext: encrypted.ciphertext,
          phoneIv: encrypted.iv,
          phoneAuthTag: encrypted.authTag,
        } : {}),
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorUserId: authUser.id,
        subjectId: authUser.id,
        action: "SAFETY_DELIVERY_PREFERENCES_UPDATED",
        resourceType: "SafetyContactPreference",
        metadata: { emailEnabled, smsEnabled, phoneUpdated: Boolean(phone) },
      },
    }),
  ]);
  return res.status(200).json({ ok: true });
}
