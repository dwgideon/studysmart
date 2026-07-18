ALTER TABLE "StudySession" ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "StudySession_userId_completedAt_idx"
  ON "StudySession"("userId", "completedAt");
