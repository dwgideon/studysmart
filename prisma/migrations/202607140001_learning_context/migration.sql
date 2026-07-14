CREATE TABLE "LearnerProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "primaryLearningGoal" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),
    "learningGoal" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearnerProfile_userId_key" ON "LearnerProfile"("userId");
CREATE INDEX "LearnerProfile_gradeLevel_idx" ON "LearnerProfile"("gradeLevel");
CREATE INDEX "Course_userId_idx" ON "Course"("userId");
CREATE INDEX "Course_userId_isPrimary_idx" ON "Course"("userId", "isPrimary");
CREATE INDEX "Course_examDate_idx" ON "Course"("examDate");

ALTER TABLE "LearnerProfile"
ADD CONSTRAINT "LearnerProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Course"
ADD CONSTRAINT "Course_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
