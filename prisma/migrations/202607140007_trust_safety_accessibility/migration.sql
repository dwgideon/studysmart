ALTER TABLE "User"
ADD COLUMN "ageGroup" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "roleVerificationStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "verifiedAt" TIMESTAMP(3);
UPDATE "User" SET "roleVerificationStatus" = 'UNVERIFIED' WHERE "accountRole" = 'TEACHER';
UPDATE "User" SET "roleVerificationStatus" = 'SELF_ATTESTED' WHERE "accountRole" = 'GUARDIAN';

CREATE TABLE "PrivacySettings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "aiPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
  "productAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "shareProgressWithTeachers" BOOLEAN NOT NULL DEFAULT true,
  "shareProgressWithGuardians" BOOLEAN NOT NULL DEFAULT true,
  "tutorHistoryEnabled" BOOLEAN NOT NULL DEFAULT true,
  "dataRetentionDays" INTEGER NOT NULL DEFAULT 365,
  "textScale" TEXT NOT NULL DEFAULT 'DEFAULT',
  "reduceMotion" BOOLEAN NOT NULL DEFAULT false,
  "highContrast" BOOLEAN NOT NULL DEFAULT false,
  "readingFont" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacySettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "subjectUserId" UUID NOT NULL,
  "grantedByUserId" UUID NOT NULL,
  "consentType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "noticeVersion" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoleVerification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "requestedRole" TEXT NOT NULL,
  "organizationName" TEXT,
  "organizationDomain" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "RoleVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SafetyEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID,
  "category" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "contentHash" TEXT,
  "reviewSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SafetyEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataRightsRequest" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "requestType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "DataRightsRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actorUserId" UUID,
  "subjectId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "PrivacySettings_userId_key" ON "PrivacySettings"("userId");
CREATE INDEX "ConsentRecord_subjectUserId_consentType_status_idx" ON "ConsentRecord"("subjectUserId", "consentType", "status");
CREATE INDEX "ConsentRecord_grantedByUserId_createdAt_idx" ON "ConsentRecord"("grantedByUserId", "createdAt");
CREATE INDEX "RoleVerification_userId_status_createdAt_idx" ON "RoleVerification"("userId", "status", "createdAt");
CREATE INDEX "SafetyEvent_userId_createdAt_idx" ON "SafetyEvent"("userId", "createdAt");
CREATE INDEX "SafetyEvent_severity_createdAt_idx" ON "SafetyEvent"("severity", "createdAt");
CREATE INDEX "DataRightsRequest_userId_status_requestedAt_idx" ON "DataRightsRequest"("userId", "status", "requestedAt");
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");
CREATE INDEX "AuditEvent_subjectId_createdAt_idx" ON "AuditEvent"("subjectId", "createdAt");
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

ALTER TABLE "PrivacySettings" ADD CONSTRAINT "PrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleVerification" ADD CONSTRAINT "RoleVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DataRightsRequest" ADD CONSTRAINT "DataRightsRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
