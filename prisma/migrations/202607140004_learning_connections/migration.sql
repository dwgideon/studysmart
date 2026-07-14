ALTER TABLE "SavedQuiz"
ADD COLUMN "courseId" UUID,
ADD COLUMN "conversationId" UUID;

CREATE TABLE "TutorConversation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "courseId" UUID,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TutorConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TutorMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "conceptId" UUID,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizConceptResult" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "savedQuizId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    CONSTRAINT "QuizConceptResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedQuiz_courseId_idx" ON "SavedQuiz"("courseId");
CREATE INDEX "SavedQuiz_conversationId_idx" ON "SavedQuiz"("conversationId");
CREATE INDEX "TutorConversation_userId_updatedAt_idx" ON "TutorConversation"("userId", "updatedAt");
CREATE INDEX "TutorConversation_courseId_idx" ON "TutorConversation"("courseId");
CREATE INDEX "TutorMessage_conversationId_createdAt_idx" ON "TutorMessage"("conversationId", "createdAt");
CREATE INDEX "TutorMessage_conceptId_idx" ON "TutorMessage"("conceptId");
CREATE UNIQUE INDEX "QuizConceptResult_savedQuizId_conceptId_key" ON "QuizConceptResult"("savedQuizId", "conceptId");
CREATE INDEX "QuizConceptResult_conceptId_idx" ON "QuizConceptResult"("conceptId");

ALTER TABLE "SavedQuiz" ADD CONSTRAINT "SavedQuiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SavedQuiz" ADD CONSTRAINT "SavedQuiz_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TutorConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TutorConversation" ADD CONSTRAINT "TutorConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorConversation" ADD CONSTRAINT "TutorConversation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TutorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuizConceptResult" ADD CONSTRAINT "QuizConceptResult_savedQuizId_fkey" FOREIGN KEY ("savedQuizId") REFERENCES "SavedQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizConceptResult" ADD CONSTRAINT "QuizConceptResult_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
