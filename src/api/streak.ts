import { prisma } from "@/lib/prisma";

/**
 * Calculate current study streak
 */
export async function getStudyStreak(userId: string): Promise<number> {
  const sessions = await prisma.studySession.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();

  for (const session of sessions) {
    const sessionDate = new Date(session.createdAt);

    const diff =
      Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

    if (diff === 0 || diff === 1) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  return streak;
}
