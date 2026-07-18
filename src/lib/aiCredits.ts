import { databaseTransaction, prisma } from "@/lib/prisma";
import { BILLABLE_SUBSCRIPTION_STATUSES, planForKey, type PlanKey } from "@/lib/plans";

const ACTIVE_STATUSES = [...BILLABLE_SUBSCRIPTION_STATUSES];

function utcMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

type AiEntitlement = {
  plan: PlanKey;
  limit: number;
  used: number;
  remaining: number;
  month: string;
};

export class AiCreditLimitError extends Error {
  readonly entitlement: AiEntitlement;

  constructor(entitlement: AiEntitlement) {
    super("Monthly AI credit allowance reached.");
    this.name = "AiCreditLimitError";
    this.entitlement = entitlement;
  }
}

async function activePlanKey(userId: string): Promise<PlanKey> {
  const subscription = await prisma.billingSubscription.findFirst({
    where: {
      beneficiaryUserId: userId,
      status: { in: ACTIVE_STATUSES },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
    orderBy: { updatedAt: "desc" },
    select: { plan: true },
  });
  return planForKey(subscription?.plan).key;
}

export async function getAiEntitlement(userId: string): Promise<AiEntitlement> {
  const month = utcMonthStart();
  const [plan, usage] = await Promise.all([
    activePlanKey(userId),
    prisma.aiUsageMonth.findUnique({ where: { userId_month: { userId, month } } }),
  ]);
  const limit = planForKey(plan).monthlyAiCredits;
  const used = Math.max(0, usage?.creditsUsed ?? 0);
  return {
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    month: month.toISOString().slice(0, 10),
  };
}

async function reserveAiCredits(input: {
  userId: string;
  feature: string;
  model: string;
  credits: number;
}) {
  const credits = Math.max(1, Math.min(100, Math.round(input.credits)));
  const entitlement = await getAiEntitlement(input.userId);
  if (entitlement.remaining < credits) {
    throw new AiCreditLimitError(entitlement);
  }
  const month = utcMonthStart();
  const event = await databaseTransaction(async (tx) => {
    await tx.aiUsageMonth.upsert({
      where: { userId_month: { userId: input.userId, month } },
      create: { userId: input.userId, month },
      update: {},
    });
    const updated = await tx.$executeRaw`
      UPDATE "AiUsageMonth"
      SET "creditsUsed" = "creditsUsed" + ${credits}, "updatedAt" = NOW()
      WHERE "userId" = ${input.userId}::uuid
        AND "month" = ${month}
        AND "creditsUsed" + ${credits} <= ${entitlement.limit}
    `;
    if (updated !== 1) {
      throw new AiCreditLimitError({
        ...entitlement,
        used: entitlement.limit,
        remaining: 0,
      });
    }
    return tx.aiUsageEvent.create({
      data: {
        userId: input.userId,
        feature: input.feature.slice(0, 80),
        model: input.model.slice(0, 100),
        credits,
      },
    });
  });
  return { id: event.id, credits, entitlement };
}

async function settleAiCredits(reservationId: string) {
  await prisma.aiUsageEvent.updateMany({
    where: { id: reservationId, status: "RESERVED" },
    data: { status: "COMPLETED", settledAt: new Date() },
  });
}

async function releaseAiCredits(reservationId: string) {
  await databaseTransaction(async (tx) => {
    const event = await tx.aiUsageEvent.findFirst({
      where: { id: reservationId, status: "RESERVED" },
    });
    if (!event) {return;}
    const month = utcMonthStart(event.createdAt);
    await tx.$executeRaw`
      UPDATE "AiUsageMonth"
      SET "creditsUsed" = GREATEST(0, "creditsUsed" - ${event.credits}), "updatedAt" = NOW()
      WHERE "userId" = ${event.userId}::uuid AND "month" = ${month}
    `;
    await tx.aiUsageEvent.update({
      where: { id: event.id },
      data: { status: "RELEASED", settledAt: new Date() },
    });
  });
}

export async function releaseStaleAiReservations(now = new Date()) {
  const stale = await prisma.aiUsageEvent.findMany({
    where: {
      status: "RESERVED",
      createdAt: { lt: new Date(now.getTime() - 30 * 60_000) },
    },
    select: { id: true },
    take: 500,
  });
  for (const event of stale) {await releaseAiCredits(event.id);}
  return { released: stale.length, remainingMayExist: stale.length === 500 };
}

export async function withAiCredits<T>(
  input: { userId: string; feature: string; model: string; credits: number },
  operation: () => Promise<T>
) {
  const reservation = await reserveAiCredits(input);
  try {
    const result = await operation();
    await settleAiCredits(reservation.id);
    return result;
  } catch (error) {
    await releaseAiCredits(reservation.id);
    throw error;
  }
}

export function aiCreditErrorResponse(error: AiCreditLimitError) {
  return {
    code: "AI_CREDIT_LIMIT_REACHED",
    error: "This month’s AI allowance has been used. Reviews, saved cards, quizzes, and games remain available without additional AI use.",
    entitlement: error.entitlement,
  };
}
