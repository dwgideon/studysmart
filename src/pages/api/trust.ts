import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { cleanText } from "@/lib/learningProfile";
import { getDistrictRestrictions } from "@/lib/districtPolicy";

const AGE_GROUPS = new Set(["UNDER_13", "TEEN", "ADULT"]);
const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "aol.com", "proton.me", "protonmail.com",
]);

async function audit(actorUserId: string, action: string, resourceType: string, resourceId?: string, subjectId?: string) {
  await prisma.auditEvent.create({
    data: { actorUserId, action, resourceType, resourceId, subjectId },
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {return res.status(404).json({ error: "Account not found." });}

  if (req.method === "GET") {
    const [settings, consent, verification, rightsRequests, linkedStudents, districtPolicy] = await Promise.all([
      prisma.privacySettings.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} }),
      prisma.consentRecord.findFirst({
        where: { subjectUserId: user.id, consentType: "PARENTAL_AI_AND_DATA_PROCESSING", status: "GRANTED", revokedAt: null },
        orderBy: { grantedAt: "desc" },
      }),
      prisma.roleVerification.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      prisma.dataRightsRequest.findMany({ where: { userId: user.id }, orderBy: { requestedAt: "desc" }, take: 10 }),
      user.accountRole === "GUARDIAN"
        ? prisma.guardianStudent.findMany({
            where: { guardianId: user.id, status: "ACTIVE" },
            select: {
              relationship: true,
              student: {
                select: {
                  id: true,
                  name: true,
                  ageGroup: true,
                  consentsFor: {
                    where: { consentType: "PARENTAL_AI_AND_DATA_PROCESSING", status: "GRANTED", revokedAt: null },
                    select: { id: true, grantedAt: true },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
      getDistrictRestrictions(user.id),
    ]);
    return res.status(200).json({
      user: {
        accountRole: user.accountRole,
        ageGroup: user.ageGroup,
        roleVerificationStatus: user.roleVerificationStatus,
        verifiedAt: user.verifiedAt,
      },
      settings,
      parentalConsent: Boolean(consent),
      verification,
      rightsRequests,
      linkedStudents,
      districtPolicy,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = cleanText(req.body?.action, 50);
  if (action === "update-age-group") {
    const ageGroup = cleanText(req.body?.ageGroup, 20).toUpperCase();
    if (!AGE_GROUPS.has(ageGroup)) {return res.status(400).json({ error: "Choose a valid age group." });}
    const protectionOrder: Record<string, number> = { UNDER_13: 0, TEEN: 1, ADULT: 2 };
    if (
      user.ageGroup !== "UNKNOWN" &&
      protectionOrder[ageGroup] > protectionOrder[user.ageGroup]
    ) {
      return res.status(409).json({
        error: "For child safety, an account cannot self-upgrade to a less protective age group. Request a correction below.",
      });
    }
    await prisma.user.update({ where: { id: user.id }, data: { ageGroup } });
    await audit(user.id, "AGE_GROUP_UPDATED", "User", user.id, user.id);
    return res.status(200).json({ ok: true, ageGroup });
  }

  if (action === "update-settings") {
    const bool = (value: unknown) => value === true;
    const retention = [30, 90, 365].includes(Number(req.body?.dataRetentionDays))
      ? Number(req.body.dataRetentionDays)
      : 365;
    const textScale = ["DEFAULT", "LARGE", "EXTRA_LARGE"].includes(req.body?.textScale)
      ? req.body.textScale
      : "DEFAULT";
    const settings = await prisma.privacySettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        aiPersonalizationEnabled: bool(req.body?.aiPersonalizationEnabled),
        productAnalyticsEnabled: bool(req.body?.productAnalyticsEnabled),
        shareProgressWithTeachers: bool(req.body?.shareProgressWithTeachers),
        shareProgressWithGuardians: bool(req.body?.shareProgressWithGuardians),
        tutorHistoryEnabled: bool(req.body?.tutorHistoryEnabled),
        dataRetentionDays: retention,
        textScale,
        reduceMotion: bool(req.body?.reduceMotion),
        highContrast: bool(req.body?.highContrast),
        readingFont: bool(req.body?.readingFont),
      },
      update: {
        aiPersonalizationEnabled: bool(req.body?.aiPersonalizationEnabled),
        productAnalyticsEnabled: bool(req.body?.productAnalyticsEnabled),
        shareProgressWithTeachers: bool(req.body?.shareProgressWithTeachers),
        shareProgressWithGuardians: bool(req.body?.shareProgressWithGuardians),
        tutorHistoryEnabled: bool(req.body?.tutorHistoryEnabled),
        dataRetentionDays: retention,
        textScale,
        reduceMotion: bool(req.body?.reduceMotion),
        highContrast: bool(req.body?.highContrast),
        readingFont: bool(req.body?.readingFont),
      },
    });
    const cutoff = new Date(Date.now() - retention * 86_400_000);
    await prisma.$transaction([
      prisma.tutorConversation.deleteMany({
        where: { userId: user.id, updatedAt: { lt: cutoff } },
      }),
      prisma.sourceMaterial.deleteMany({
        where: { userId: user.id, createdAt: { lt: cutoff } },
      }),
    ]);
    await audit(user.id, "PRIVACY_SETTINGS_UPDATED", "PrivacySettings", settings.id, user.id);
    return res.status(200).json({ ok: true, settings });
  }

  if (action === "request-role-verification") {
    if (user.accountRole !== "TEACHER") {return res.status(403).json({ error: "Teacher role required." });}
    const organizationName = cleanText(req.body?.organizationName, 160);
    if (!organizationName) {return res.status(400).json({ error: "School or district name is required." });}
    const domain = user.email.split("@")[1]?.toLowerCase() ?? "";
    const emailConfirmed = Boolean(authUser.email_confirmed_at);
    const verifiedOrganization = emailConfirmed && domain && !PUBLIC_EMAIL_DOMAINS.has(domain)
      ? await prisma.organization.findFirst({
          where: { verifiedDomain: domain, status: "ACTIVE" },
          select: { id: true },
        })
      : null;
    const domainVerified = Boolean(verifiedOrganization);
    const status = domainVerified ? "DOMAIN_VERIFIED" : "PENDING_REVIEW";
    const verification = await prisma.$transaction(async (tx) => {
      const created = await tx.roleVerification.create({
        data: {
          userId: user.id,
          requestedRole: "TEACHER",
          organizationName,
          organizationDomain: domain || null,
          status,
          reviewedAt: domainVerified ? new Date() : null,
          reviewNote: domainVerified
            ? "Confirmed email ownership for an independently verified organization domain."
            : "Manual school affiliation review required; email domain alone is not verification.",
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          roleVerificationStatus: status,
          verifiedAt: domainVerified ? new Date() : null,
        },
      });
      return created;
    });
    await audit(user.id, "ROLE_VERIFICATION_REQUESTED", "RoleVerification", verification.id, user.id);
    return res.status(200).json({ ok: true, verification });
  }

  if (action === "grant-parental-consent" || action === "revoke-parental-consent") {
    if (user.accountRole !== "GUARDIAN") {return res.status(403).json({ error: "Guardian role required." });}
    const studentId = cleanText(req.body?.studentId, 64);
    const link = await prisma.guardianStudent.findFirst({
      where: { guardianId: user.id, studentId, status: "ACTIVE" },
    });
    if (!link) {return res.status(404).json({ error: "Connected learner not found." });}
    if (action === "grant-parental-consent") {
      const consent = await prisma.consentRecord.create({
        data: {
          subjectUserId: studentId,
          grantedByUserId: user.id,
          consentType: "PARENTAL_AI_AND_DATA_PROCESSING",
          status: "GRANTED",
          noticeVersion: "2026-07-k12-v1",
          grantedAt: new Date(),
        },
      });
      await audit(user.id, "PARENTAL_CONSENT_GRANTED", "ConsentRecord", consent.id, studentId);
    } else {
      await prisma.consentRecord.updateMany({
        where: { subjectUserId: studentId, grantedByUserId: user.id, consentType: "PARENTAL_AI_AND_DATA_PROCESSING", status: "GRANTED", revokedAt: null },
        data: { status: "REVOKED", revokedAt: new Date() },
      });
      await audit(user.id, "PARENTAL_CONSENT_REVOKED", "ConsentRecord", undefined, studentId);
    }
    return res.status(200).json({ ok: true });
  }

  if (action === "request-data-right") {
    const requestType = cleanText(req.body?.requestType, 30).toUpperCase();
    if (!["DELETE", "CORRECT", "RESTRICT"].includes(requestType)) {return res.status(400).json({ error: "Invalid request type." });}
    const existing = await prisma.dataRightsRequest.findFirst({ where: { userId: user.id, requestType, status: "OPEN" } });
    const request = existing ?? await prisma.dataRightsRequest.create({ data: { userId: user.id, requestType } });
    await audit(user.id, "DATA_RIGHT_REQUESTED", "DataRightsRequest", request.id, user.id);
    return res.status(201).json({ ok: true, request });
  }

  if (action === "report-safety-concern") {
    const category = cleanText(req.body?.category, 80) || "USER_REPORTED_CONCERN";
    const details = cleanText(req.body?.details, 2000);
    const reviewSummary = details
      .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email removed]")
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[phone removed]")
      .slice(0, 500);
    const event = await prisma.safetyEvent.create({
      data: {
        userId: user.id,
        category,
        severity: "REVIEW",
        action: "QUEUED_FOR_REVIEW",
        source: "USER_REPORT",
        contentHash: details ? createHash("sha256").update(details).digest("hex") : null,
        reviewSummary: reviewSummary || null,
      },
    });
    await audit(user.id, "SAFETY_CONCERN_REPORTED", "SafetyEvent", event.id, user.id);
    return res.status(201).json({ ok: true, reference: event.id.slice(0, 8) });
  }

  return res.status(400).json({ error: "Unknown action." });
}

export default withApiMonitoring("api.trust", handler);
