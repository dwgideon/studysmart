CREATE TABLE "OperationalRun" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "job" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "requestId" TEXT,
  "summary" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "OperationalRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalRun_job_status_startedAt_idx"
  ON "OperationalRun"("job", "status", "startedAt");
CREATE INDEX "OperationalRun_startedAt_idx" ON "OperationalRun"("startedAt");
