ALTER TABLE "User" ADD COLUMN "accountRole" TEXT NOT NULL DEFAULT 'STUDENT';
ALTER TABLE "LearnerProfile"
ADD COLUMN "diagnosticCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastDiagnosticAt" TIMESTAMP(3);
UPDATE "LearnerProfile" SET "gradeLevel" = '12' WHERE "gradeLevel" IN ('COLLEGE_UNDERGRAD', 'COLLEGE_GRAD');

CREATE TABLE "Classroom" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "teacherId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "gradeBand" TEXT NOT NULL,
  "joinCode" TEXT NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassroomMembership" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "classroomId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassroomMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuardianInvite" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guardianId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuardianInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuardianStudent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guardianId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "relationship" TEXT NOT NULL DEFAULT 'Guardian',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuardianStudent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assignment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "classroomId" UUID NOT NULL,
  "teacherId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "instructions" TEXT,
  "targetConcepts" JSONB,
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssignmentSubmission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assignmentId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
  "score" DOUBLE PRECISION,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosticAssessment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "courseId" UUID,
  "gradeBand" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "questions" JSONB NOT NULL,
  "responses" JSONB NOT NULL DEFAULT '[]',
  "abilityEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "summary" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "DiagnosticAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosticConceptResult" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assessmentId" UUID NOT NULL,
  "conceptId" UUID NOT NULL,
  "correctCount" INTEGER NOT NULL,
  "totalCount" INTEGER NOT NULL,
  "estimatedMastery" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "DiagnosticConceptResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Classroom_joinCode_key" ON "Classroom"("joinCode");
CREATE INDEX "Classroom_teacherId_archivedAt_idx" ON "Classroom"("teacherId", "archivedAt");
CREATE UNIQUE INDEX "ClassroomMembership_classroomId_studentId_key" ON "ClassroomMembership"("classroomId", "studentId");
CREATE INDEX "ClassroomMembership_studentId_status_idx" ON "ClassroomMembership"("studentId", "status");
CREATE UNIQUE INDEX "GuardianInvite_code_key" ON "GuardianInvite"("code");
CREATE INDEX "GuardianInvite_guardianId_expiresAt_idx" ON "GuardianInvite"("guardianId", "expiresAt");
CREATE UNIQUE INDEX "GuardianStudent_guardianId_studentId_key" ON "GuardianStudent"("guardianId", "studentId");
CREATE INDEX "GuardianStudent_studentId_status_idx" ON "GuardianStudent"("studentId", "status");
CREATE INDEX "Assignment_classroomId_dueAt_idx" ON "Assignment"("classroomId", "dueAt");
CREATE INDEX "Assignment_teacherId_idx" ON "Assignment"("teacherId");
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_studentId_key" ON "AssignmentSubmission"("assignmentId", "studentId");
CREATE INDEX "AssignmentSubmission_studentId_status_idx" ON "AssignmentSubmission"("studentId", "status");
CREATE INDEX "DiagnosticAssessment_userId_status_startedAt_idx" ON "DiagnosticAssessment"("userId", "status", "startedAt");
CREATE INDEX "DiagnosticAssessment_courseId_idx" ON "DiagnosticAssessment"("courseId");
CREATE UNIQUE INDEX "DiagnosticConceptResult_assessmentId_conceptId_key" ON "DiagnosticConceptResult"("assessmentId", "conceptId");
CREATE INDEX "DiagnosticConceptResult_conceptId_idx" ON "DiagnosticConceptResult"("conceptId");

ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassroomMembership" ADD CONSTRAINT "ClassroomMembership_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassroomMembership" ADD CONSTRAINT "ClassroomMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianInvite" ADD CONSTRAINT "GuardianInvite_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianStudent" ADD CONSTRAINT "GuardianStudent_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianStudent" ADD CONSTRAINT "GuardianStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiagnosticAssessment" ADD CONSTRAINT "DiagnosticAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiagnosticAssessment" ADD CONSTRAINT "DiagnosticAssessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DiagnosticConceptResult" ADD CONSTRAINT "DiagnosticConceptResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "DiagnosticAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiagnosticConceptResult" ADD CONSTRAINT "DiagnosticConceptResult_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
