ALTER TABLE "Classroom" ADD COLUMN "organizationId" UUID;
ALTER TABLE "SafetyViolation" ALTER COLUMN "ciphertext" DROP NOT NULL;
ALTER TABLE "SafetyViolation" ALTER COLUMN "iv" DROP NOT NULL;
ALTER TABLE "SafetyViolation" ALTER COLUMN "authTag" DROP NOT NULL;
ALTER TABLE "SafetyViolation" ADD COLUMN "detailsPurgedAt" TIMESTAMP(3);

CREATE TABLE "Organization" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "verifiedDomain" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING', "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMembership" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "userId" UUID NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'TEACHER', "status" TEXT NOT NULL DEFAULT 'ACTIVE', "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DistrictPolicy" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL,
  "allowedGradeBands" JSONB NOT NULL, "aiTutorEnabled" BOOLEAN NOT NULL DEFAULT true,
  "multimodalEnabled" BOOLEAN NOT NULL DEFAULT true, "externalKnowledgeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "requireGuardianConsent" BOOLEAN NOT NULL DEFAULT true, "dataRetentionDays" INTEGER NOT NULL DEFAULT 365,
  "safetyAlertChannels" JSONB NOT NULL, "lockedSettings" JSONB NOT NULL,
  "policyVersion" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "DistrictPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataRetentionRun" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "summary" JSONB, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
  CONSTRAINT "DataRetentionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_verifiedDomain_key" ON "Organization"("verifiedDomain");
CREATE INDEX "Organization_status_name_idx" ON "Organization"("status", "name");
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");
CREATE INDEX "OrganizationMembership_userId_status_idx" ON "OrganizationMembership"("userId", "status");
CREATE INDEX "OrganizationMembership_organizationId_role_status_idx" ON "OrganizationMembership"("organizationId", "role", "status");
CREATE UNIQUE INDEX "DistrictPolicy_organizationId_key" ON "DistrictPolicy"("organizationId");
CREATE INDEX "DistrictPolicy_updatedAt_idx" ON "DistrictPolicy"("updatedAt");
CREATE INDEX "DataRetentionRun_status_startedAt_idx" ON "DataRetentionRun"("status", "startedAt");
CREATE INDEX "Classroom_organizationId_archivedAt_idx" ON "Classroom"("organizationId", "archivedAt");

ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DistrictPolicy" ADD CONSTRAINT "DistrictPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
