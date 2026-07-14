import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { decryptSensitiveValue } from "@/lib/sensitiveEncryption";

const MAX_ATTEMPTS = 6;
type DeliveryChannel = "EMAIL" | "SMS" | "PUSH";

type DeliveryResult = {
  providerId?: string;
};

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");
}

function safetyMessage(urgent: boolean, reminder: boolean) {
  const opening = reminder
    ? "A StudySmart safety alert still needs acknowledgment."
    : urgent
      ? "StudySmart detected an urgent safety concern involving your connected learner."
      : "StudySmart blocked a safety-related request from your connected learner.";
  return `${opening} Sign in to the secure Safety Alerts center to review it and respond: ${appUrl()}/community. Sensitive details are never included in email, text, or push previews.`;
}

async function sendEmail(to: string, message: string, urgent: boolean) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SAFETY_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured.");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: urgent
        ? "Urgent StudySmart safety alert"
        : "StudySmart safety alert",
      text: message,
    }),
  });
  const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `Email provider returned ${response.status}.`);
  }
  return { providerId: payload.id };
}

async function sendSms(phone: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SAFETY_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("SMS delivery is not configured.");
  }
  const form = new URLSearchParams({ To: phone, From: from, Body: message });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    }
  );
  const payload = await response.json().catch(() => ({})) as { sid?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `SMS provider returned ${response.status}.`);
  }
  return { providerId: payload.sid };
}

async function sendPush(
  subscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  message: string
) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? `mailto:safety@${new URL(appUrl()).hostname}`;
  if (!publicKey || !privateKey) {
    throw new Error("Web Push delivery is not configured.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  let delivered = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          title: "StudySmart safety alert",
          body: message,
          url: `${appUrl()}/community`,
        })
      );
      delivered += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { active: false },
        });
        continue;
      }
      throw error;
    }
  }
  if (delivered === 0) {
    throw new Error("No active push subscription accepted the alert.");
  }
  return { providerId: `web-push:${delivered}` };
}

async function channelsForRecipient(recipientUserId: string) {
  const [preference, pushCount] = await Promise.all([
    prisma.safetyContactPreference.findUnique({ where: { userId: recipientUserId } }),
    prisma.pushSubscription.count({ where: { userId: recipientUserId, active: true } }),
  ]);
  const channels: DeliveryChannel[] = [];
  if (preference?.emailEnabled !== false) {channels.push("EMAIL");}
  if (
    preference?.smsEnabled &&
    preference.phoneCiphertext &&
    preference.phoneIv &&
    preference.phoneAuthTag
  ) {channels.push("SMS");}
  if (preference?.pushEnabled && pushCount > 0) {channels.push("PUSH");}
  return channels;
}

async function createDeliveryRows(notificationId: string, recipientUserId: string, escalationLevel: number) {
  const channels = await channelsForRecipient(recipientUserId);
  if (channels.length === 0) {return;}
  await prisma.safetyDelivery.createMany({
    data: channels.map((channel) => ({ notificationId, channel, escalationLevel })),
    skipDuplicates: true,
  });
}

export async function enqueueSafetyDeliveriesForViolation(violationId: string) {
  const notifications = await prisma.safetyNotification.findMany({
    where: { violationId },
    select: { id: true, recipientUserId: true },
  });
  await Promise.all(notifications.map((notification) =>
    createDeliveryRows(notification.id, notification.recipientUserId, 0)
  ));
  await processSafetyDeliveries(25, violationId);
}

async function backfillMissingDeliveries() {
  const missing = await prisma.safetyNotification.findMany({
    where: { deliveries: { none: {} } },
    select: { id: true, recipientUserId: true },
    take: 100,
  });
  await Promise.all(missing.map((notification) =>
    createDeliveryRows(notification.id, notification.recipientUserId, 0)
  ));
}

async function enqueueAcknowledgmentReminders(now: Date) {
  const levels = [
    { level: 1, minutes: Number(process.env.SAFETY_FIRST_REMINDER_MINUTES ?? 10) },
    { level: 2, minutes: Number(process.env.SAFETY_SECOND_REMINDER_MINUTES ?? 30) },
  ];
  for (const { level, minutes } of levels) {
    const cutoff = new Date(now.getTime() - Math.max(1, minutes) * 60_000);
    const notifications = await prisma.safetyNotification.findMany({
      where: {
        createdAt: { lte: cutoff },
        escalationLevel: { lt: level },
        responseStatus: "UNACKNOWLEDGED",
        violation: {
          category: "SELF_HARM_CONCERN",
          notifications: { none: { acknowledgedAt: { not: null } } },
        },
      },
      select: { id: true, recipientUserId: true },
      take: 100,
    });
    for (const notification of notifications) {
      await createDeliveryRows(notification.id, notification.recipientUserId, level);
      await prisma.safetyNotification.update({
        where: { id: notification.id },
        data: { escalationLevel: level, lastEscalatedAt: now },
      });
    }
  }
}

async function deliver(
  channel: string,
  recipient: {
    email: string;
    safetyContactPreference: {
      phoneCiphertext: string | null;
      phoneIv: string | null;
      phoneAuthTag: string | null;
    } | null;
    pushSubscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>;
  },
  message: string,
  urgent: boolean
): Promise<DeliveryResult> {
  if (channel === "EMAIL") {return sendEmail(recipient.email, message, urgent);}
  if (channel === "SMS") {
    const phone = recipient.safetyContactPreference;
    if (!phone?.phoneCiphertext || !phone.phoneIv || !phone.phoneAuthTag) {
      throw new Error("No verified safety phone number is configured.");
    }
    return sendSms(decryptSensitiveValue({
      ciphertext: phone.phoneCiphertext,
      iv: phone.phoneIv,
      authTag: phone.phoneAuthTag,
    }), message);
  }
  if (channel === "PUSH") {
    return sendPush(recipient.pushSubscriptions, message);
  }
  throw new Error(`Unsupported delivery channel: ${channel}`);
}

export async function processSafetyDeliveries(limit = 100, violationId?: string) {
  const now = new Date();
  if (!violationId) {
    await backfillMissingDeliveries();
    await enqueueAcknowledgmentReminders(now);
  }
  const deliveries = await prisma.safetyDelivery.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attemptCount: { lt: MAX_ATTEMPTS },
      nextAttemptAt: { lte: now },
      ...(violationId ? { notification: { violationId } } : {}),
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: Math.max(1, Math.min(limit, 250)),
    include: {
      notification: {
        include: {
          recipient: {
            include: {
              safetyContactPreference: true,
              pushSubscriptions: { where: { active: true } },
            },
          },
          violation: { select: { category: true } },
        },
      },
    },
  });
  const summary = { attempted: deliveries.length, sent: 0, failed: 0 };
  for (const item of deliveries) {
    const urgent = item.notification.violation.category === "SELF_HARM_CONCERN";
    const message = safetyMessage(urgent, item.escalationLevel > 0);
    try {
      const result = await deliver(
        item.channel,
        item.notification.recipient,
        message,
        urgent
      );
      await prisma.safetyDelivery.update({
        where: { id: item.id },
        data: {
          status: "SENT",
          attemptCount: { increment: 1 },
          lastAttemptAt: now,
          sentAt: now,
          providerId: result.providerId,
          lastError: null,
        },
      });
      summary.sent += 1;
    } catch (error) {
      const attempts = item.attemptCount + 1;
      const delayMinutes = Math.min(360, 2 ** attempts);
      await prisma.safetyDelivery.update({
        where: { id: item.id },
        data: {
          status: attempts >= MAX_ATTEMPTS ? "EXHAUSTED" : "FAILED",
          attemptCount: attempts,
          lastAttemptAt: now,
          nextAttemptAt: new Date(now.getTime() + delayMinutes * 60_000),
          lastError: (error instanceof Error ? error.message : "Delivery failed.").slice(0, 500),
        },
      });
      summary.failed += 1;
    }
  }
  return summary;
}
