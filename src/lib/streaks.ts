// src/lib/streaks.ts
import { prisma } from "@/lib/prisma";

/**
 * Returns the user's current consecutive-day study streak
 */
export async function getStudyStreak(userId: string): Promise<number> {
  const sessions = await prisma.study_sessions.findMany({
    where: { user_id: userId },
    select: { started_at: true },
    orderBy: { started_at: "desc" },
  });

  if (sessions.length === 0) return 0;

  // Convert to unique YYYY-MM-DD strings
  const days = Array.from(
    new Set(
      sessions
        .filter(s => s.started_at)
        .map(s =>
          s.started_at!.toISOString().split("T")[0]
        )
    )
  );

  let streak = 0;
  let currentDay = new Date();

  for (let i = 0; i < days.length; i++) {
    const expected = currentDay.toISOString().split("T")[0];

    if (days[i] === expected) {
      streak++;
      currentDay.setDate(currentDay.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
