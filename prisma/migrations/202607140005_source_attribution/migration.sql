ALTER TABLE "StudySession" ADD COLUMN "sourceMaterialId" UUID;
ALTER TABLE "SavedQuiz" ADD COLUMN "sourceMaterialId" UUID;
ALTER TABLE "TutorConversation" ADD COLUMN "sourceMaterialId" UUID;
ALTER TABLE "TutorMessage"
ADD COLUMN "attributionMode" TEXT NOT NULL DEFAULT 'GENERAL_KNOWLEDGE',
ADD COLUMN "citations" JSONB;

CREATE TABLE "SourceMaterial" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "courseId" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceMaterial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudySession_sourceMaterialId_idx" ON "StudySession"("sourceMaterialId");
CREATE INDEX "SavedQuiz_sourceMaterialId_idx" ON "SavedQuiz"("sourceMaterialId");
CREATE INDEX "TutorConversation_sourceMaterialId_idx" ON "TutorConversation"("sourceMaterialId");
CREATE INDEX "SourceMaterial_userId_createdAt_idx" ON "SourceMaterial"("userId", "createdAt");
CREATE INDEX "SourceMaterial_courseId_createdAt_idx" ON "SourceMaterial"("courseId", "createdAt");

ALTER TABLE "SourceMaterial" ADD CONSTRAINT "SourceMaterial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceMaterial" ADD CONSTRAINT "SourceMaterial_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SavedQuiz" ADD CONSTRAINT "SavedQuiz_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TutorConversation" ADD CONSTRAINT "TutorConversation_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
