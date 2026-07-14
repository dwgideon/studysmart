ALTER TABLE "User"
ADD COLUMN "safetyStrikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "learningLockedUntil" TIMESTAMP(3);

CREATE TABLE "SafetyViolation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "category" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "authTag" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "lockoutUntil" TIMESTAMP(3),
  "appealedAt" TIMESTAMP(3),
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SafetyViolation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SafetyNotification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "recipientUserId" UUID NOT NULL,
  "violationId" UUID NOT NULL,
  "recipientRole" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SafetyNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SafetyViolation_userId_createdAt_idx" ON "SafetyViolation"("userId", "createdAt");
CREATE INDEX "SafetyViolation_lockoutUntil_idx" ON "SafetyViolation"("lockoutUntil");
CREATE UNIQUE INDEX "SafetyNotification_recipientUserId_violationId_key" ON "SafetyNotification"("recipientUserId", "violationId");
CREATE INDEX "SafetyNotification_recipientUserId_readAt_createdAt_idx" ON "SafetyNotification"("recipientUserId", "readAt", "createdAt");

ALTER TABLE "SafetyViolation" ADD CONSTRAINT "SafetyViolation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyNotification" ADD CONSTRAINT "SafetyNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyNotification" ADD CONSTRAINT "SafetyNotification_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "SafetyViolation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
