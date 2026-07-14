import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Updates streak when user completes a study activity. */
export async function updateUserStreak(userId: string) {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const existing = await prisma.studyStreak.findUnique({
    where: { userId },
  });

  if (!existing) {
    return prisma.studyStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date(),
      },
    });
  }

  const last = existing.lastStudyDate
    ? startOfDay(existing.lastStudyDate)
    : null;

  if (last && last.getTime() === today.getTime()) {
    return existing;
  }

  let currentStreak = 1;
  if (last && last.getTime() === yesterday.getTime()) {
    currentStreak = existing.currentStreak + 1;
  }

  const longestStreak = Math.max(existing.longestStreak, currentStreak);

  return prisma.studyStreak.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastStudyDate: new Date(),
    },
  });
}

export async function getStreakSummary(userId: string) {
  const row = await prisma.studyStreak.findUnique({ where: { userId } });
  return {
    currentStreak: row?.currentStreak ?? 0,
    longestStreak: row?.longestStreak ?? 0,
    lastStudyDate: row?.lastStudyDate?.toISOString() ?? null,
  };
}
