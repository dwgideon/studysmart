ALTER TABLE "CardReview" ADD COLUMN "clientEventId" TEXT;

CREATE UNIQUE INDEX "CardReview_userId_clientEventId_key"
  ON "CardReview"("userId", "clientEventId");
