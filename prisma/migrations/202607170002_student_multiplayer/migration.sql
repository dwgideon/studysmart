CREATE TABLE "MultiplayerRoom" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "hostUserId" UUID NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'GRID',
  "status" TEXT NOT NULL DEFAULT 'LOBBY',
  "phase" TEXT NOT NULL DEFAULT 'LOBBY',
  "questions" JSONB NOT NULL,
  "currentQuestion" INTEGER NOT NULL DEFAULT -1,
  "roundDurationSeconds" INTEGER NOT NULL DEFAULT 30,
  "maxPlayers" INTEGER NOT NULL DEFAULT 30,
  "roundStartedAt" TIMESTAMP(3),
  "roundEndsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MultiplayerRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MultiplayerParticipant" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "roomId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "alias" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "correctCount" INTEGER NOT NULL DEFAULT 0,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "sparksEarned" INTEGER NOT NULL DEFAULT 0,
  "rewardsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  CONSTRAINT "MultiplayerParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MultiplayerAnswer" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "roomId" UUID NOT NULL,
  "participantId" UUID NOT NULL,
  "questionIndex" INTEGER NOT NULL,
  "selectedIndex" INTEGER NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "points" INTEGER NOT NULL,
  "responseMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MultiplayerAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MultiplayerRoom_code_key" ON "MultiplayerRoom"("code");
CREATE INDEX "MultiplayerRoom_hostUserId_status_expiresAt_idx" ON "MultiplayerRoom"("hostUserId", "status", "expiresAt");
CREATE INDEX "MultiplayerRoom_status_expiresAt_idx" ON "MultiplayerRoom"("status", "expiresAt");
CREATE UNIQUE INDEX "MultiplayerParticipant_roomId_userId_key" ON "MultiplayerParticipant"("roomId", "userId");
CREATE UNIQUE INDEX "MultiplayerParticipant_roomId_alias_key" ON "MultiplayerParticipant"("roomId", "alias");
CREATE INDEX "MultiplayerParticipant_userId_joinedAt_idx" ON "MultiplayerParticipant"("userId", "joinedAt");
CREATE UNIQUE INDEX "MultiplayerAnswer_participantId_questionIndex_key" ON "MultiplayerAnswer"("participantId", "questionIndex");
CREATE INDEX "MultiplayerAnswer_roomId_questionIndex_idx" ON "MultiplayerAnswer"("roomId", "questionIndex");

ALTER TABLE "MultiplayerRoom" ADD CONSTRAINT "MultiplayerRoom_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MultiplayerParticipant" ADD CONSTRAINT "MultiplayerParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MultiplayerRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MultiplayerParticipant" ADD CONSTRAINT "MultiplayerParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MultiplayerAnswer" ADD CONSTRAINT "MultiplayerAnswer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MultiplayerRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MultiplayerAnswer" ADD CONSTRAINT "MultiplayerAnswer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "MultiplayerParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
