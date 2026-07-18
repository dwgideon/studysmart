CREATE TABLE "MobileDevice" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "installationId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "pushToken" TEXT,
  "appVersion" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MobileDevice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MobileDevice_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MobileDevice_installationId_key"
  ON "MobileDevice"("installationId");
CREATE INDEX "MobileDevice_userId_active_idx"
  ON "MobileDevice"("userId", "active");
CREATE INDEX "MobileDevice_pushToken_active_idx"
  ON "MobileDevice"("pushToken", "active");
CREATE INDEX "MobileDevice_lastSeenAt_idx" ON "MobileDevice"("lastSeenAt");
