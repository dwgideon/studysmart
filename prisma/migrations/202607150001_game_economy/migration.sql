CREATE TABLE "GameProfile" (
    "userId" UUID NOT NULL,
    "sparks" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSparks" INTEGER NOT NULL DEFAULT 0,
    "equippedHair" TEXT NOT NULL DEFAULT 'hair_starter',
    "equippedTop" TEXT NOT NULL DEFAULT 'top_starter',
    "equippedExtra" TEXT NOT NULL DEFAULT 'extra_none',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "AvatarItemOwnership" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "itemId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvatarItemOwnership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameRun" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "mode" TEXT NOT NULL,
    "project" TEXT,
    "questions" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "sparksEarned" INTEGER NOT NULL DEFAULT 0,
    "rewardsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AvatarItemOwnership_userId_itemId_key" ON "AvatarItemOwnership"("userId", "itemId");
CREATE INDEX "AvatarItemOwnership_userId_idx" ON "AvatarItemOwnership"("userId");
CREATE INDEX "GameRun_userId_createdAt_idx" ON "GameRun"("userId", "createdAt");
CREATE INDEX "GameRun_userId_completedAt_idx" ON "GameRun"("userId", "completedAt");

ALTER TABLE "GameProfile" ADD CONSTRAINT "GameProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvatarItemOwnership" ADD CONSTRAINT "AvatarItemOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
