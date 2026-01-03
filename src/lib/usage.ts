// src/lib/usage.ts
import { prisma } from "@/lib/prisma";

/**
 * Increments the token usage for a given user this month.
 * Automatically creates a record if one doesn’t exist yet.
 */
export async function recordTokenUsage(userId: string, tokens: number) {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  const existing = await prisma.usage.findUnique({
    where: { userId_month: { userId, month } },
  });

  if (existing) {
    await prisma.usage.update({
      where: { userId_month: { userId, month } },
      data: { tokensUsed: existing.tokensUsed + tokens },
    });
  } else {
    await prisma.usage.create({
      data: {
        userId,
        month,
        tokensUsed: tokens,
      },
    });
  }
}

/**
 * Fetches usage data for the current month.
 */
export async function getUserUsage(userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const usage = await prisma.usage.findUnique({
    where: { userId_month: { userId, month } },
  });
  return usage ?? { tokensUsed: 0, month };
}
