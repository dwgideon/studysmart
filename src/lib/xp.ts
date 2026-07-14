import { prisma } from "@/lib/prisma";

export async function getUserXp(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true },
  });
  return user?.xp ?? 0;
}

export async function awardXp(userId: string, amount: number): Promise<number> {
  if (amount <= 0) {return getUserXp(userId);}

  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true },
  });

  return user.xp;
}
