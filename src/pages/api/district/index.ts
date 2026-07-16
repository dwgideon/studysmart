import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { cleanText } from "@/lib/learningProfile";

const GRADE_BANDS = ["K–2", "3–5", "6–8", "9–12"];
const RETENTION_OPTIONS = new Set([30, 90, 365]);
const MEMBER_ROLES = new Set(["ADMIN", "TEACHER"]);

function boolean(value: unknown) {return value === true;}
function stringList(value: unknown, allowed: string[]) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.includes(item)))]
    : [];
}
function organizationSlug(name: string, domain: string) {
  return `${name}-${domain}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

async function audit(
  actorUserId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.auditEvent.create({
    data: { actorUserId, action, resourceType, resourceId, metadata },
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {return res.status(404).json({ error: "Account not found." });}

  if (req.method === "GET") {
    const memberships = await prisma.organizationMembership.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        organization: {
          include: {
            policy: true,
            memberships: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                role: true,
                verifiedAt: true,
                user: { select: { id: true, name: true, email: true, roleVerificationStatus: true } },
              },
            },
            _count: { select: { classrooms: true } },
          },
        },
      },
    });
    return res.status(200).json({
      eligibleToCreate: user.accountRole === "TEACHER" && user.roleVerificationStatus === "DOMAIN_VERIFIED",
      memberships,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = cleanText(req.body?.action, 50);
  if (action === "create-organization") {
    if (user.accountRole !== "TEACHER" || user.roleVerificationStatus !== "DOMAIN_VERIFIED") {
      return res.status(403).json({ error: "A domain-verified educator account is required." });
    }
    const verification = await prisma.roleVerification.findFirst({
      where: { userId: user.id, status: "DOMAIN_VERIFIED", organizationDomain: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    const name = cleanText(req.body?.name, 160);
    const domain = verification?.organizationDomain?.toLowerCase();
    if (!name || !domain) {return res.status(400).json({ error: "Verified organization details are required." });}
    const existing = await prisma.organization.findUnique({ where: { verifiedDomain: domain } });
    if (existing) {
      return res.status(409).json({ error: "This verified domain already has a district workspace. Ask its owner to add you." });
    }
    const organization = await prisma.organization.create({
      data: {
        name,
        slug: organizationSlug(name, domain),
        verifiedDomain: domain,
        status: "VERIFIED",
        createdByUserId: user.id,
        policy: {
          create: {
            allowedGradeBands: GRADE_BANDS,
            safetyAlertChannels: ["IN_APP", "EMAIL"],
            lockedSettings: [],
          },
        },
        memberships: {
          create: { userId: user.id, role: "OWNER", verifiedAt: new Date() },
        },
      },
      include: { policy: true },
    });
    await audit(user.id, "DISTRICT_WORKSPACE_CREATED", "Organization", organization.id);
    return res.status(201).json({ organization });
  }

  const organizationId = cleanText(req.body?.organizationId, 64);
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      userId: user.id,
      status: "ACTIVE",
      role: { in: ["OWNER", "ADMIN"] },
    },
    include: { organization: true },
  });
  if (!membership) {return res.status(403).json({ error: "District administrator access required." });}

  if (action === "update-policy") {
    const allowedGradeBands = stringList(req.body?.allowedGradeBands, GRADE_BANDS);
    if (allowedGradeBands.length === 0) {
      return res.status(400).json({ error: "Allow at least one K–12 grade band." });
    }
    const retention = RETENTION_OPTIONS.has(Number(req.body?.dataRetentionDays))
      ? Number(req.body.dataRetentionDays)
      : 365;
    const safetyAlertChannels = stringList(req.body?.safetyAlertChannels, ["IN_APP", "EMAIL", "SMS", "PUSH"]);
    if (!safetyAlertChannels.includes("IN_APP")) {safetyAlertChannels.unshift("IN_APP");}
    const policy = await prisma.districtPolicy.upsert({
      where: { organizationId },
      create: {
        organizationId,
        allowedGradeBands,
        aiTutorEnabled: boolean(req.body?.aiTutorEnabled),
        multimodalEnabled: boolean(req.body?.multimodalEnabled),
        externalKnowledgeEnabled: boolean(req.body?.externalKnowledgeEnabled),
        requireGuardianConsent: boolean(req.body?.requireGuardianConsent),
        dataRetentionDays: retention,
        safetyAlertChannels,
        lockedSettings: stringList(req.body?.lockedSettings, ["AI_TUTOR", "MULTIMODAL", "EXTERNAL_KNOWLEDGE", "RETENTION"]),
      },
      update: {
        allowedGradeBands,
        aiTutorEnabled: boolean(req.body?.aiTutorEnabled),
        multimodalEnabled: boolean(req.body?.multimodalEnabled),
        externalKnowledgeEnabled: boolean(req.body?.externalKnowledgeEnabled),
        requireGuardianConsent: boolean(req.body?.requireGuardianConsent),
        dataRetentionDays: retention,
        safetyAlertChannels,
        lockedSettings: stringList(req.body?.lockedSettings, ["AI_TUTOR", "MULTIMODAL", "EXTERNAL_KNOWLEDGE", "RETENTION"]),
        policyVersion: { increment: 1 },
      },
    });
    await audit(user.id, "DISTRICT_POLICY_UPDATED", "DistrictPolicy", policy.id, { policyVersion: policy.policyVersion });
    return res.status(200).json({ policy });
  }

  if (action === "add-member") {
    const email = cleanText(req.body?.email, 254).toLowerCase();
    const role = cleanText(req.body?.role, 20).toUpperCase();
    if (!email || !MEMBER_ROLES.has(role)) {return res.status(400).json({ error: "Valid educator email and role required." });}
    if (membership.organization.verifiedDomain && !email.endsWith(`@${membership.organization.verifiedDomain}`)) {
      return res.status(400).json({ error: "Educator must use the verified organization email domain." });
    }
    const target = await prisma.user.findUnique({ where: { email } });
    if (!target || target.accountRole !== "TEACHER" || !["VERIFIED", "DOMAIN_VERIFIED"].includes(target.roleVerificationStatus)) {
      return res.status(404).json({ error: "A verified StudySmart educator with that email was not found." });
    }
    const added = await prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId, userId: target.id } },
      create: { organizationId, userId: target.id, role, verifiedAt: new Date() },
      update: { role, status: "ACTIVE", verifiedAt: new Date() },
    });
    await audit(user.id, "DISTRICT_MEMBER_ADDED", "OrganizationMembership", added.id, { role });
    return res.status(201).json({ member: added });
  }

  if (action === "deactivate-member") {
    const memberId = cleanText(req.body?.memberId, 64);
    const target = await prisma.organizationMembership.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!target || target.role === "OWNER") {
      return res.status(400).json({ error: "The workspace owner cannot be deactivated." });
    }
    await prisma.organizationMembership.update({
      where: { id: target.id },
      data: { status: "INACTIVE" },
    });
    await audit(user.id, "DISTRICT_MEMBER_DEACTIVATED", "OrganizationMembership", target.id);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Unknown action." });
}

export default withApiMonitoring("api.district", handler);
