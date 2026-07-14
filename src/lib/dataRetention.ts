import { prisma } from "@/lib/prisma";
import { getDistrictRestrictions } from "@/lib/districtPolicy";
import { DAY_MS, retentionCutoff } from "@/lib/dataRetentionPolicy";

type RetentionSummary = {
  usersProcessed: number;
  tutorConversationsDeleted: number;
  sourceMaterialsDeleted: number;
  aiTracesDeleted: number;
  experimentEventsDeleted: number;
  safetyDetailsPurged: number;
  stalePushSubscriptionsDisabled: number;
  expiredOperationalRecordsDeleted: number;
};

export async function enforceDataRetention(now = new Date()) {
  const run = await prisma.dataRetentionRun.create({ data: {} });
  const summary: RetentionSummary = {
    usersProcessed: 0,
    tutorConversationsDeleted: 0,
    sourceMaterialsDeleted: 0,
    aiTracesDeleted: 0,
    experimentEventsDeleted: 0,
    safetyDetailsPurged: 0,
    stalePushSubscriptionsDisabled: 0,
    expiredOperationalRecordsDeleted: 0,
  };
  try {
    const settings = await prisma.privacySettings.findMany({
      select: { userId: true, dataRetentionDays: true },
    });
    for (const setting of settings) {
      const district = await getDistrictRestrictions(setting.userId);
      const cutoff = retentionCutoff(
        now,
        setting.dataRetentionDays,
        district.dataRetentionDays
      );
      const [conversations, sources, traces, events] = await prisma.$transaction([
        prisma.tutorConversation.deleteMany({
          where: { userId: setting.userId, updatedAt: { lt: cutoff } },
        }),
        prisma.sourceMaterial.deleteMany({
          where: { userId: setting.userId, createdAt: { lt: cutoff } },
        }),
        prisma.aiInteractionTrace.deleteMany({
          where: { userId: setting.userId, createdAt: { lt: cutoff } },
        }),
        prisma.experimentEvent.deleteMany({
          where: { userId: setting.userId, createdAt: { lt: cutoff } },
        }),
      ]);
      summary.usersProcessed += 1;
      summary.tutorConversationsDeleted += conversations.count;
      summary.sourceMaterialsDeleted += sources.count;
      summary.aiTracesDeleted += traces.count;
      summary.experimentEventsDeleted += events.count;
    }

    const requestedSafetyDays = Number(process.env.SAFETY_DETAIL_RETENTION_DAYS ?? 30);
    const safetyDays = Number.isFinite(requestedSafetyDays)
      ? Math.max(7, Math.min(90, Math.round(requestedSafetyDays)))
      : 30;
    const safety = await prisma.safetyViolation.updateMany({
      where: {
        createdAt: { lt: new Date(now.getTime() - safetyDays * DAY_MS) },
        detailsPurgedAt: null,
        ciphertext: { not: null },
      },
      data: {
        ciphertext: null,
        iv: null,
        authTag: null,
        detailsPurgedAt: now,
      },
    });
    summary.safetyDetailsPurged = safety.count;

    const [push, launchStates, buckets] = await prisma.$transaction([
      prisma.pushSubscription.updateMany({
        where: {
          active: true,
          updatedAt: { lt: new Date(now.getTime() - 180 * DAY_MS) },
        },
        data: { active: false },
      }),
      prisma.ltiLaunchState.deleteMany({
        where: { expiresAt: { lt: new Date(now.getTime() - 7 * DAY_MS) } },
      }),
      prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: now } } }),
    ]);
    summary.stalePushSubscriptionsDisabled = push.count;
    summary.expiredOperationalRecordsDeleted = launchStates.count + buckets.count;

    await prisma.dataRetentionRun.update({
      where: { id: run.id },
      data: { status: "COMPLETED", completedAt: new Date(), summary },
    });
    return { runId: run.id, ...summary };
  } catch (error) {
    await prisma.dataRetentionRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        summary: { error: error instanceof Error ? error.message.slice(0, 300) : "Unknown retention error" },
      },
    });
    throw error;
  }
}
