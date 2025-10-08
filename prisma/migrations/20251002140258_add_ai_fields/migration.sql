/*
  Warnings:

  - You are about to drop the column `duration` on the `StudySession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."StudySession" DROP COLUMN "duration",
ADD COLUMN     "aiFlashcards" JSONB,
ADD COLUMN     "aiQuiz" JSONB,
ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "content" TEXT;
