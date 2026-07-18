import { createHash } from "crypto";
import { openai } from "@/lib/openai";
import { isAiFreeTestMode } from "@/lib/aiFreeTestMode";
import { databaseTransaction, prisma } from "@/lib/prisma";
import {
  decryptSensitiveValue,
  encryptSensitiveValue,
  type EncryptedValue,
} from "@/lib/sensitiveEncryption";
import { enqueueSafetyDeliveriesForViolation } from "@/lib/safetyDelivery";
import {
  EDUCATIONAL_SENSITIVE_CONTEXT,
  localK12SafetyDecision,
  type SafetyDecision,
} from "@/lib/k12SafetyRules";
import { getDistrictRestrictions } from "@/lib/districtPolicy";

export const K12_SAFETY_PROMPT = `You are a K–12 learning assistant. Protect the learner's privacy and wellbeing.
- Never request or expose a child's full name, address, phone number, school schedule, passwords, precise location, or private contact details.
- Do not use profanity or generate sexual, violent, self-harm, drug, weapon, hateful, or illegal content or instructions.
- Permit legitimate, factual, age-appropriate health, biology, history, literature, and personal-safety education without graphic detail.
- For sensitive topics, stay factual, age-appropriate, non-graphic, and encourage help from a trusted adult when appropriate.
- Do not encourage secrecy from parents, guardians, teachers, counselors, or other trusted adults.
- Do not shame, manipulate, diagnose, or claim to replace a teacher, counselor, doctor, emergency service, or trusted adult.
- If a learner may be in immediate danger, encourage contacting local emergency services and a trusted adult now.`;


const USER_INPUT_SOURCES = new Set([
  "MATERIAL_UPLOAD",
  "QUIZ_BUILDER_INPUT",
  "QUIZ_INPUT",
  "TRUE_FALSE_INPUT",
  "TUTOR_INPUT",
]);
const NON_PUNITIVE_CATEGORIES = new Set([
  "EXPLOITATION_OR_GROOMING",
  "MODERATION_UNAVAILABLE",
  "PERSONAL_INFORMATION",
  "SELF_HARM_CONCERN",
]);
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CAPTURED_ATTEMPT_CHARS = 100_000;

export function decryptSafetyAttempt(attempt: {
  ciphertext: string | null;
  iv: string | null;
  authTag: string | null;
}) {
  if (!attempt.ciphertext || !attempt.iv || !attempt.authTag) {return null;}
  return decryptSensitiveValue(attempt as EncryptedValue);
}

function isStrikeEligible(
  source: string,
  category: string,
  accountRole: string
) {
  return accountRole === "STUDENT" &&
    USER_INPUT_SOURCES.has(source) &&
    !NON_PUNITIVE_CATEGORIES.has(category);
}

function shouldCreateGuardianAlert(
  source: string,
  category: string,
  accountRole: string
) {
  return accountRole === "STUDENT" &&
    USER_INPUT_SOURCES.has(source) &&
    category === "SELF_HARM_CONCERN";
}

async function guardianRecipients(userId: string) {
  const guardianLinks = await prisma.guardianStudent.findMany({
    where: {
      studentId: userId,
      status: "ACTIVE",
      guardian: { accountRole: "GUARDIAN" },
    },
    select: { guardianId: true },
  });
  return [...new Set(guardianLinks.map((link) => link.guardianId))].map(
    (recipientUserId) => ({
      recipientUserId,
      recipientRole: "GUARDIAN" as const,
    })
  );
}

async function adultRecipients(userId: string) {
  const [guardians, classroomLinks] = await Promise.all([
    guardianRecipients(userId),
    prisma.classroomMembership.findMany({
      where: {
        studentId: userId,
        status: "ACTIVE",
        classroom: {
          archivedAt: null,
          teacher: {
            accountRole: "TEACHER",
            roleVerificationStatus: { in: ["VERIFIED", "DOMAIN_VERIFIED"] },
          },
        },
      },
      select: { classroom: { select: { teacherId: true } } },
    }),
  ]);
  const recipients = new Map<string, "GUARDIAN" | "TEACHER">();
  for (const guardian of guardians) {
    recipients.set(guardian.recipientUserId, guardian.recipientRole);
  }
  for (const link of classroomLinks) {recipients.set(link.classroom.teacherId, "TEACHER");}
  return [...recipients].map(([recipientUserId, recipientRole]) => ({
    recipientUserId,
    recipientRole,
  }));
}

function strikeResponse(strikeCount: number, lockedUntil?: Date) {
  const adultNotice = "An alert with the attempted request was sent to connected parents, guardians, and verified teachers.";
  if (lockedUntil) {
    return `That request was blocked. This is safety strike 3 of 3, so learning tools are locked until ${lockedUntil.toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })}. ${adultNotice}`;
  }
  return `That request was blocked because it is not appropriate for StudySmart. This is safety strike ${strikeCount} of 3. ${adultNotice}`;
}

async function recordSafetyEvent(
  userId: string,
  source: string,
  decision: SafetyDecision,
  content: string
): Promise<SafetyDecision> {
  if (decision.allowed) {return decision;}
  const contentHash = createHash("sha256").update(content).digest("hex");
  const learner = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountRole: true },
  });
  if (
    learner &&
    shouldCreateGuardianAlert(source, decision.category, learner.accountRole)
  ) {
    const recipients = await guardianRecipients(userId);
    if (recipients.length === 0) {
      await prisma.safetyEvent.create({
        data: {
          userId,
          category: decision.category,
          severity: decision.severity,
          action: "BLOCKED_NO_CONNECTED_GUARDIAN",
          source,
          contentHash,
        },
      });
      return {
        ...decision,
        safeResponse: `${decision.safeResponse} Please show this message to a parent, guardian, counselor, or another trusted adult now.`,
      };
    }

    const encrypted = encryptSensitiveValue(
      content.slice(0, MAX_CAPTURED_ATTEMPT_CHARS)
    );
    const recorded = await databaseTransaction(async (tx) => {
      const violation = await tx.safetyViolation.create({
        data: {
          userId,
          category: decision.category,
          source,
          ...encrypted,
          attemptNumber: 0,
        },
      });
      await Promise.all([
        tx.safetyEvent.create({
          data: {
            userId,
            category: decision.category,
            severity: decision.severity,
            action: "URGENT_GUARDIAN_ALERT_CREATED",
            source,
            contentHash,
          },
        }),
        tx.safetyNotification.createMany({
          data: recipients.map((recipient) => ({
            ...recipient,
            violationId: violation.id,
          })),
          skipDuplicates: true,
        }),
        tx.auditEvent.createMany({
          data: recipients.map((recipient) => ({
            actorUserId: null,
            subjectId: userId,
            action: "URGENT_GUARDIAN_NOTIFICATION_CREATED",
            resourceType: "SafetyViolation",
            resourceId: violation.id,
            metadata: { recipientUserId: recipient.recipientUserId },
          })),
        }),
      ]);
      return {
        ...decision,
        safeResponse: `${decision.safeResponse} Your connected parent or guardian has been alerted so they can support you.`,
        violationId: violation.id,
      };
    });
    if (recorded.violationId) {
      await enqueueSafetyDeliveriesForViolation(recorded.violationId);
    }
    return recorded;
  }

  if (!learner || !isStrikeEligible(source, decision.category, learner.accountRole)) {
    await prisma.safetyEvent.create({
      data: {
        userId,
        category: decision.category,
        severity: decision.severity,
        action: "BLOCKED_AND_REDIRECTED",
        source,
        contentHash,
      },
    });
    return decision;
  }

  const recipients = await adultRecipients(userId);
  const encrypted = encryptSensitiveValue(
    content.slice(0, MAX_CAPTURED_ATTEMPT_CHARS)
  );
  const now = new Date();
  const recorded = await databaseTransaction(async (tx) => {
    await tx.user.updateMany({
      where: { id: userId, learningLockedUntil: { lte: now } },
      data: { safetyStrikeCount: 0, learningLockedUntil: null },
    });
    const state = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { safetyStrikeCount: true, learningLockedUntil: true },
    });
    if (state.learningLockedUntil && state.learningLockedUntil > now) {
      await tx.safetyEvent.create({
        data: {
          userId,
          category: decision.category,
          severity: decision.severity,
          action: "BLOCKED_DURING_LOCKOUT",
          source,
          contentHash,
        },
      });
      return {
        ...decision,
        safeResponse: strikeResponse(3, state.learningLockedUntil),
        strikeCount: 3,
        lockedUntil: state.learningLockedUntil.toISOString(),
      };
    }

    const strikeCount = Math.min(state.safetyStrikeCount + 1, 3);
    const lockedUntil = strikeCount === 3
      ? new Date(now.getTime() + THIRTY_DAYS_MS)
      : undefined;
    const violation = await tx.safetyViolation.create({
      data: {
        userId,
        category: decision.category,
        source,
        ...encrypted,
        attemptNumber: strikeCount,
        lockoutUntil: lockedUntil,
      },
    });
    await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: {
          safetyStrikeCount: strikeCount,
          learningLockedUntil: lockedUntil ?? null,
        },
      }),
      tx.safetyEvent.create({
        data: {
          userId,
          category: decision.category,
          severity: decision.severity,
          action: lockedUntil ? "LEARNER_LOCKED_30_DAYS" : "BLOCKED_ADULTS_NOTIFIED",
          source,
          contentHash,
        },
      }),
      recipients.length
        ? tx.safetyNotification.createMany({
            data: recipients.map((recipient) => ({
              ...recipient,
              violationId: violation.id,
            })),
            skipDuplicates: true,
          })
        : Promise.resolve(),
      recipients.length
        ? tx.auditEvent.createMany({
            data: recipients.map((recipient) => ({
              actorUserId: null,
              subjectId: userId,
              action: "SAFETY_NOTIFICATION_CREATED",
              resourceType: "SafetyViolation",
              resourceId: violation.id,
              metadata: { recipientUserId: recipient.recipientUserId },
            })),
          })
        : Promise.resolve(),
    ]);
    return {
      ...decision,
      safeResponse: strikeResponse(strikeCount, lockedUntil),
      strikeCount,
      lockedUntil: lockedUntil?.toISOString(),
      violationId: violation.id,
    };
  });
  if (recorded.violationId) {
    await enqueueSafetyDeliveriesForViolation(recorded.violationId);
  }
  return recorded;
}

export async function moderateK12Content(
  userId: string,
  content: string,
  source: string
): Promise<SafetyDecision> {
  const local = localK12SafetyDecision(content);
  if (local) {return recordSafetyEvent(userId, source, local, content);}
  if (isAiFreeTestMode) {
    return { allowed: true, category: "SAFE_LOCAL_TEST", severity: "LOW" };
  }

  let categories: Record<string, boolean>;
  try {
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: content.slice(0, 20_000),
    });
    const result = moderation.results[0];
    categories = result?.categories as unknown as Record<string, boolean>;
  } catch (error) {
    console.warn("Moderation service unavailable; AI request blocked:", error);
    return recordSafetyEvent(userId, source, {
      allowed: false,
      category: "MODERATION_UNAVAILABLE",
      severity: "MEDIUM",
      safeResponse:
        "The safety check is temporarily unavailable, so I can’t process this request right now. Please try again later.",
    }, content);
  }
  const blockedCategories = [
    "harassment",
    "harassment/threatening",
    "hate",
    "hate/threatening",
    "illicit",
    "illicit/violent",
    "self-harm/intent",
    "self-harm/instructions",
    "sexual",
    "sexual/minors",
    "violence",
    "violence/graphic",
  ].filter((category) => categories?.[category]);
  const sexualOnly = blockedCategories.length > 0 &&
    blockedCategories.every((category) => category.startsWith("sexual"));
  if (sexualOnly && EDUCATIONAL_SENSITIVE_CONTEXT.test(content)) {
    return { allowed: true, category: "SAFE_EDUCATIONAL_CONTEXT", severity: "LOW" };
  }
  if (blockedCategories.length > 0) {
    const selfHarm = blockedCategories.some((category) => category.startsWith("self-harm"));
    const category = selfHarm ? "SELF_HARM_CONCERN" : blockedCategories[0];
    const decision: SafetyDecision = {
      allowed: false,
      category,
      severity: selfHarm || categories?.["sexual/minors"] ? "CRITICAL" : "HIGH",
      safeResponse: selfHarm
        ? "You deserve support from a real person. Please tell a trusted adult now. If you might act or are in immediate danger, call local emergency services. In the U.S. or Canada, call or text 988."
        : "I can’t help with harmful, explicit, hateful, threatening, or illegal content. I can help with a safe, age-appropriate school topic instead.",
    };
    return recordSafetyEvent(userId, source, decision, content);
  }
  return { allowed: true, category: "SAFE", severity: "LOW" };
}

export async function aiAccessForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ageGroup: true },
  });
  if (!user || user.ageGroup === "UNKNOWN") {
    return { allowed: false, reason: "AGE_GROUP_REQUIRED" } as const;
  }
  const districtPolicy = await getDistrictRestrictions(userId);
  if (!districtPolicy.aiTutorEnabled) {
    return { allowed: false, reason: "DISTRICT_AI_DISABLED" } as const;
  }
  let reason = "AGE_ELIGIBLE" as "AGE_ELIGIBLE" | "PARENTAL_CONSENT";
  if (user.ageGroup === "UNDER_13" || districtPolicy.requireGuardianConsent) {
    const consent = await prisma.consentRecord.findFirst({
      where: {
        subjectUserId: userId,
        consentType: "PARENTAL_AI_AND_DATA_PROCESSING",
        status: "GRANTED",
        revokedAt: null,
      },
      orderBy: { grantedAt: "desc" },
    });
    if (!consent) {
      return {
        allowed: false,
        reason: districtPolicy.requireGuardianConsent
          ? "DISTRICT_GUARDIAN_CONSENT_REQUIRED"
          : "PARENTAL_CONSENT_REQUIRED",
      } as const;
    }
    reason = "PARENTAL_CONSENT";
  }
  const rateAllowed = await consumeRateLimit(userId, "AI", 30, 60_000);
  return rateAllowed
    ? ({ allowed: true, reason, districtPolicy } as const)
    : ({ allowed: false, reason: "RATE_LIMITED" } as const);
}

async function consumeRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
) {
  const key = `${action}:${userId}`;
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
