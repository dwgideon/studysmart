import { prisma } from "@/lib/prisma";

export async function recordTokenUsage(userId: string, tokens: number) {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  const existing = await prisma.usage.findUnique({
    where: {
      userId_month: {
        userId,
        month,
      },
    },
  });

  if (existing) {
    await prisma.usage.update({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      data: {
        tokensUsed: existing.tokensUsed + tokens,
      },
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

export async function getUserUsage(userId: string) {
  const month = new Date().toISOString().slice(0, 7);

  const usage = await prisma.usage.findUnique({
    where: {
      userId_month: {
        userId,
        month,
      },
    },
  });

  return usage ?? { userId, month, tokensUsed: 0 };
}
