import { prisma } from "@/lib/prisma";

type DistrictRestrictions = {
  organizationIds: string[];
  allowedGradeBands: string[] | null;
  aiTutorEnabled: boolean;
  multimodalEnabled: boolean;
  externalKnowledgeEnabled: boolean;
  requireGuardianConsent: boolean;
  dataRetentionDays: number | null;
};

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function getDistrictRestrictions(
  userId: string
): Promise<DistrictRestrictions> {
  const [memberships, classrooms] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { userId, status: "ACTIVE", organization: { status: "VERIFIED" } },
      select: { organization: { select: { id: true, policy: true } } },
    }),
    prisma.classroomMembership.findMany({
      where: {
        studentId: userId,
        status: "ACTIVE",
        classroom: {
          archivedAt: null,
          organization: { status: "VERIFIED" },
        },
      },
      select: { classroom: { select: { organization: { select: { id: true, policy: true } } } } },
    }),
  ]);
  const organizations = new Map<string, (typeof memberships)[number]["organization"]>();
  for (const membership of memberships) {
    organizations.set(membership.organization.id, membership.organization);
  }
  for (const membership of classrooms) {
    const organization = membership.classroom.organization;
    if (organization) {organizations.set(organization.id, organization);}
  }
  const policies = [...organizations.values()].flatMap((organization) =>
    organization.policy ? [organization.policy] : []
  );
  const gradeBandSets = policies
    .map((policy) => strings(policy.allowedGradeBands))
    .filter((items) => items.length > 0);
  const allowedGradeBands = gradeBandSets.length
    ? gradeBandSets.reduce((common, next) => common.filter((item) => next.includes(item)))
    : null;
  return {
    organizationIds: [...organizations.keys()],
    allowedGradeBands,
    aiTutorEnabled: policies.every((policy) => policy.aiTutorEnabled),
    multimodalEnabled: policies.every((policy) => policy.multimodalEnabled),
    externalKnowledgeEnabled: policies.every((policy) => policy.externalKnowledgeEnabled),
    requireGuardianConsent: policies.some((policy) => policy.requireGuardianConsent),
    dataRetentionDays: policies.length
      ? Math.min(...policies.map((policy) => policy.dataRetentionDays))
      : null,
  };
}
