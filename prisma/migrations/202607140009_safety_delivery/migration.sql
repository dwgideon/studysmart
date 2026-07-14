ALTER TABLE "SafetyNotification"
  ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
  ADD COLUMN "acknowledgedByUserId" UUID,
  ADD COLUMN "responseStatus" TEXT NOT NULL DEFAULT 'UNACKNOWLEDGED',
  ADD COLUMN "escalationLevel" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastEscalatedAt" TIMESTAMP(3);

CREATE TABLE "SafetyContactPreference" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
  "phoneCiphertext" TEXT,
  "phoneIv" TEXT,
  "phoneAuthTag" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SafetyContactPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushSubscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SafetyDelivery" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "notificationId" UUID NOT NULL,
  "channel" TEXT NOT NULL,
  "escalationLevel" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "providerId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SafetyDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SafetyContactPreference_userId_key" ON "SafetyContactPreference"("userId");
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_active_idx" ON "PushSubscription"("userId", "active");
CREATE UNIQUE INDEX "SafetyDelivery_notificationId_channel_escalationLevel_key" ON "SafetyDelivery"("notificationId", "channel", "escalationLevel");
CREATE INDEX "SafetyDelivery_status_nextAttemptAt_idx" ON "SafetyDelivery"("status", "nextAttemptAt");
CREATE INDEX "SafetyDelivery_notificationId_createdAt_idx" ON "SafetyDelivery"("notificationId", "createdAt");
CREATE INDEX "SafetyNotification_responseStatus_createdAt_idx" ON "SafetyNotification"("responseStatus", "createdAt");

ALTER TABLE "SafetyContactPreference" ADD CONSTRAINT "SafetyContactPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyDelivery" ADD CONSTRAINT "SafetyDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "SafetyNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
