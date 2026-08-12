CREATE TABLE "CurriculumUnit" (
  "id" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "standards" JSONB NOT NULL,
  "prerequisiteConcepts" JSONB NOT NULL,
  "source" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CurriculumUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumLesson" (
  "id" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "schemaVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "sequence" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "learningObjective" TEXT NOT NULL,
  "prerequisites" JSONB NOT NULL,
  "standards" JSONB NOT NULL,
  "teacherExplanation" TEXT NOT NULL,
  "studentExplanation" TEXT NOT NULL,
  "workedExample" JSONB NOT NULL,
  "guidedPractice" JSONB NOT NULL,
  "independentPractice" JSONB NOT NULL,
  "misconceptionChecks" JSONB NOT NULL,
  "exitTicket" JSONB NOT NULL,
  "readAloudScript" JSONB NOT NULL,
  "accessibilityAlternatives" JSONB NOT NULL,
  "remediationPath" JSONB NOT NULL,
  "extensionPath" JSONB NOT NULL,
  "masteryEvidenceRules" JSONB NOT NULL,
  "reviewSchedule" JSONB NOT NULL,
  "source" JSONB NOT NULL,
  "humanApprovedAt" TIMESTAMP(3),
  "educatorReviewer" TEXT,
  "accessibilityReviewedAt" TIMESTAMP(3),
  "safetyReviewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CurriculumLesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumConcept" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prerequisiteIds" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurriculumConcept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumQuestion" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "answerIndex" INTEGER NOT NULL,
  "explanation" TEXT NOT NULL,
  "conceptKey" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  CONSTRAINT "CurriculumQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumFlashcard" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "front" TEXT NOT NULL,
  "back" TEXT NOT NULL,
  "conceptKey" TEXT NOT NULL,
  CONSTRAINT "CurriculumFlashcard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumGamePrompt" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "prompt" JSONB NOT NULL,
  CONSTRAINT "CurriculumGamePrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumTutorPrompt" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "context" JSONB NOT NULL,
  CONSTRAINT "CurriculumTutorPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumReviewSchedule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lessonId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "intervalsDays" JSONB NOT NULL,
  "retentionTarget" DOUBLE PRECISION NOT NULL,
  "masteryThreshold" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurriculumReviewSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumLessonAttempt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "lessonId" TEXT NOT NULL,
  "courseId" UUID,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "responses" JSONB NOT NULL DEFAULT '[]',
  "evidence" JSONB NOT NULL DEFAULT '[]',
  "score" DOUBLE PRECISION,
  "exitTicketCorrect" BOOLEAN,
  "durationMs" INTEGER,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "CurriculumLessonAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumLessonEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "lessonId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurriculumLessonEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CurriculumUnit_grade_subject_status_idx" ON "CurriculumUnit"("grade", "subject", "status");
CREATE UNIQUE INDEX "CurriculumLesson_unitId_sequence_version_key" ON "CurriculumLesson"("unitId", "sequence", "version");
CREATE INDEX "CurriculumLesson_unitId_sequence_idx" ON "CurriculumLesson"("unitId", "sequence");
CREATE INDEX "CurriculumLesson_status_grade_subject_idx" ON "CurriculumLesson"("status", "grade", "subject");
CREATE INDEX "CurriculumConcept_lessonId_idx" ON "CurriculumConcept"("lessonId");
CREATE INDEX "CurriculumQuestion_lessonId_conceptKey_idx" ON "CurriculumQuestion"("lessonId", "conceptKey");
CREATE INDEX "CurriculumFlashcard_lessonId_conceptKey_idx" ON "CurriculumFlashcard"("lessonId", "conceptKey");
CREATE INDEX "CurriculumGamePrompt_lessonId_mode_idx" ON "CurriculumGamePrompt"("lessonId", "mode");
CREATE INDEX "CurriculumTutorPrompt_lessonId_idx" ON "CurriculumTutorPrompt"("lessonId");
CREATE UNIQUE INDEX "CurriculumReviewSchedule_lessonId_version_key" ON "CurriculumReviewSchedule"("lessonId", "version");
CREATE INDEX "CurriculumReviewSchedule_lessonId_idx" ON "CurriculumReviewSchedule"("lessonId");
CREATE INDEX "CurriculumLessonAttempt_userId_startedAt_idx" ON "CurriculumLessonAttempt"("userId", "startedAt");
CREATE INDEX "CurriculumLessonAttempt_lessonId_status_idx" ON "CurriculumLessonAttempt"("lessonId", "status");
CREATE INDEX "CurriculumLessonAttempt_courseId_completedAt_idx" ON "CurriculumLessonAttempt"("courseId", "completedAt");
CREATE INDEX "CurriculumLessonEvent_userId_eventType_createdAt_idx" ON "CurriculumLessonEvent"("userId", "eventType", "createdAt");
CREATE INDEX "CurriculumLessonEvent_lessonId_eventType_createdAt_idx" ON "CurriculumLessonEvent"("lessonId", "eventType", "createdAt");

ALTER TABLE "CurriculumLesson" ADD CONSTRAINT "CurriculumLesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "CurriculumUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumConcept" ADD CONSTRAINT "CurriculumConcept_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumQuestion" ADD CONSTRAINT "CurriculumQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumFlashcard" ADD CONSTRAINT "CurriculumFlashcard_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumGamePrompt" ADD CONSTRAINT "CurriculumGamePrompt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumTutorPrompt" ADD CONSTRAINT "CurriculumTutorPrompt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumReviewSchedule" ADD CONSTRAINT "CurriculumReviewSchedule_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumLessonAttempt" ADD CONSTRAINT "CurriculumLessonAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumLessonAttempt" ADD CONSTRAINT "CurriculumLessonAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumLessonAttempt" ADD CONSTRAINT "CurriculumLessonAttempt_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CurriculumLessonEvent" ADD CONSTRAINT "CurriculumLessonEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumLessonEvent" ADD CONSTRAINT "CurriculumLessonEvent_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CurriculumLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
