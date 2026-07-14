ALTER TABLE "StudySession" ADD COLUMN "courseId" UUID;
ALTER TABLE "Flashcard" ADD COLUMN "conceptId" UUID;

CREATE TABLE "Concept" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConceptMastery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptMastery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Concept_courseId_normalizedName_key" ON "Concept"("courseId", "normalizedName");
CREATE INDEX "Concept_courseId_idx" ON "Concept"("courseId");
CREATE UNIQUE INDEX "ConceptMastery_userId_conceptId_key" ON "ConceptMastery"("userId", "conceptId");
CREATE INDEX "ConceptMastery_userId_status_idx" ON "ConceptMastery"("userId", "status");
CREATE INDEX "ConceptMastery_conceptId_idx" ON "ConceptMastery"("conceptId");
CREATE INDEX "StudySession_courseId_idx" ON "StudySession"("courseId");
CREATE INDEX "Flashcard_conceptId_idx" ON "Flashcard"("conceptId");

ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_conceptId_fkey"
FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Concept" ADD CONSTRAINT "Concept_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConceptMastery" ADD CONSTRAINT "ConceptMastery_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConceptMastery" ADD CONSTRAINT "ConceptMastery_conceptId_fkey"
FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
