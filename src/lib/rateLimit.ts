import { prisma } from "@/lib/prisma";

export async function consumeRateLimit(
  subjectId: string,
  action: string,
  limit: number,
  windowMs: number
) {
  const key = `${action}:${subjectId}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const accepted = await prisma.$queryRaw<Array<{ key: string }>>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = ${now}
    WHERE "RateLimitBucket"."resetAt" <= ${now}
       OR "RateLimitBucket"."count" < ${limit}
    RETURNING "key"
  `;
  return accepted.length === 1;
}
