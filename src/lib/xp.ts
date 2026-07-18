import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type XpDatabase = Pick<Prisma.TransactionClient, "user">;

export async function getUserXp(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true },
  });
  return user?.xp ?? 0;
}

export async function awardXp(
  userId: string,
  amount: number,
  database: XpDatabase = prisma
): Promise<number> {
  if (amount <= 0) {
    const user = await database.user.findUnique({ where: { id: userId }, select: { xp: true } });
    return user?.xp ?? 0;
  }

  const user = await database.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true },
  });

  return user.xp;
}
