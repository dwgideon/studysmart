CREATE TABLE "AiInteractionTrace" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID, "feature" TEXT NOT NULL,
  "model" TEXT NOT NULL, "promptVersion" TEXT NOT NULL, "inputHash" TEXT NOT NULL,
  "outputHash" TEXT NOT NULL, "latencyMs" INTEGER NOT NULL, "allowed" BOOLEAN NOT NULL DEFAULT true,
  "safetyCategory" TEXT, "grounded" BOOLEAN NOT NULL DEFAULT false,
  "citationCount" INTEGER NOT NULL DEFAULT 0, "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiInteractionTrace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiMetricDaily" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "day" DATE NOT NULL, "feature" TEXT NOT NULL,
  "model" TEXT NOT NULL, "requestCount" INTEGER NOT NULL, "failureCount" INTEGER NOT NULL,
  "blockedCount" INTEGER NOT NULL, "criticalSafetyCount" INTEGER NOT NULL,
  "meanLatencyMs" DOUBLE PRECISION NOT NULL, "groundingRate" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiMetricDaily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiEvalRun" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "suite" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING', "summary" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
  CONSTRAINT "AiEvalRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiEvalResult" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "runId" UUID NOT NULL, "caseKey" TEXT NOT NULL,
  "passed" BOOLEAN NOT NULL, "severity" TEXT NOT NULL, "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiEvalResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Experiment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "key" TEXT NOT NULL, "name" TEXT NOT NULL,
  "hypothesis" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT', "variants" JSONB NOT NULL,
  "allocation" JSONB NOT NULL, "guardrails" JSONB NOT NULL, "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperimentAssignment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "experimentId" UUID NOT NULL, "userId" UUID NOT NULL,
  "variant" TEXT NOT NULL, "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperimentEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "experimentId" UUID NOT NULL, "assignmentId" UUID,
  "userId" UUID NOT NULL, "eventName" TEXT NOT NULL, "value" DOUBLE PRECISION, "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperimentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiInteractionTrace_feature_model_createdAt_idx" ON "AiInteractionTrace"("feature", "model", "createdAt");
CREATE INDEX "AiInteractionTrace_safetyCategory_createdAt_idx" ON "AiInteractionTrace"("safetyCategory", "createdAt");
CREATE INDEX "AiInteractionTrace_userId_createdAt_idx" ON "AiInteractionTrace"("userId", "createdAt");
CREATE UNIQUE INDEX "AiMetricDaily_day_feature_model_key" ON "AiMetricDaily"("day", "feature", "model");
CREATE INDEX "AiMetricDaily_day_feature_idx" ON "AiMetricDaily"("day", "feature");
CREATE INDEX "AiEvalRun_suite_startedAt_idx" ON "AiEvalRun"("suite", "startedAt");
CREATE INDEX "AiEvalRun_status_startedAt_idx" ON "AiEvalRun"("status", "startedAt");
CREATE UNIQUE INDEX "AiEvalResult_runId_caseKey_key" ON "AiEvalResult"("runId", "caseKey");
CREATE INDEX "AiEvalResult_passed_severity_createdAt_idx" ON "AiEvalResult"("passed", "severity", "createdAt");
CREATE UNIQUE INDEX "Experiment_key_key" ON "Experiment"("key");
CREATE INDEX "Experiment_status_startsAt_endsAt_idx" ON "Experiment"("status", "startsAt", "endsAt");
CREATE UNIQUE INDEX "ExperimentAssignment_experimentId_userId_key" ON "ExperimentAssignment"("experimentId", "userId");
CREATE INDEX "ExperimentAssignment_userId_assignedAt_idx" ON "ExperimentAssignment"("userId", "assignedAt");
CREATE INDEX "ExperimentEvent_experimentId_eventName_createdAt_idx" ON "ExperimentEvent"("experimentId", "eventName", "createdAt");
CREATE INDEX "ExperimentEvent_userId_createdAt_idx" ON "ExperimentEvent"("userId", "createdAt");

ALTER TABLE "AiInteractionTrace" ADD CONSTRAINT "AiInteractionTrace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiEvalResult" ADD CONSTRAINT "AiEvalResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AiEvalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperimentEvent" ADD CONSTRAINT "ExperimentEvent_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperimentEvent" ADD CONSTRAINT "ExperimentEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ExperimentAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExperimentEvent" ADD CONSTRAINT "ExperimentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
