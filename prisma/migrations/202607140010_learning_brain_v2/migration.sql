ALTER TABLE "Flashcard"
  ADD COLUMN "memoryStability" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN "memoryDifficulty" DOUBLE PRECISION NOT NULL DEFAULT 5,
  ADD COLUMN "targetRetention" DOUBLE PRECISION NOT NULL DEFAULT 0.9;

ALTER TABLE "Concept"
  ADD COLUMN "standardFramework" TEXT,
  ADD COLUMN "standardCode" TEXT,
  ADD COLUMN "gradeBand" TEXT,
  ADD COLUMN "domain" TEXT;

ALTER TABLE "ConceptMastery"
  ADD COLUMN "uncertainty" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN "memoryStability" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN "memoryDifficulty" DOUBLE PRECISION NOT NULL DEFAULT 5,
  ADD COLUMN "guessRate" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  ADD COLUMN "slipRate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  ADD COLUMN "learningRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
  ADD COLUMN "forgettingRate" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
  ADD COLUMN "lastEvidenceAt" TIMESTAMP(3),
  ADD COLUMN "nextReviewAt" TIMESTAMP(3);

ALTER TABLE "CardReview"
  ADD COLUMN "responseTimeMs" INTEGER,
  ADD COLUMN "hintCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "rating" INTEGER;

CREATE TABLE "ConceptPrerequisite" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conceptId" UUID NOT NULL,
  "prerequisiteId" UUID NOT NULL,
  "strength" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "source" TEXT NOT NULL DEFAULT 'INFERRED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConceptPrerequisite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasteryEvidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "conceptId" UUID NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "correct" BOOLEAN NOT NULL,
  "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "responseTimeMs" INTEGER,
  "hintCount" INTEGER NOT NULL DEFAULT 0,
  "independent" BOOLEAN NOT NULL DEFAULT true,
  "probabilityBefore" DOUBLE PRECISION NOT NULL,
  "probabilityAfter" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MasteryEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Concept_standardFramework_standardCode_idx" ON "Concept"("standardFramework", "standardCode");
CREATE UNIQUE INDEX "ConceptPrerequisite_conceptId_prerequisiteId_key" ON "ConceptPrerequisite"("conceptId", "prerequisiteId");
CREATE INDEX "ConceptPrerequisite_prerequisiteId_idx" ON "ConceptPrerequisite"("prerequisiteId");
CREATE INDEX "ConceptMastery_userId_nextReviewAt_idx" ON "ConceptMastery"("userId", "nextReviewAt");
CREATE INDEX "MasteryEvidence_userId_createdAt_idx" ON "MasteryEvidence"("userId", "createdAt");
CREATE INDEX "MasteryEvidence_conceptId_createdAt_idx" ON "MasteryEvidence"("conceptId", "createdAt");
CREATE INDEX "MasteryEvidence_sourceType_sourceId_idx" ON "MasteryEvidence"("sourceType", "sourceId");

ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasteryEvidence" ADD CONSTRAINT "MasteryEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MasteryEvidence" ADD CONSTRAINT "MasteryEvidence_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
