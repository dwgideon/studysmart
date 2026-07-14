ALTER TABLE "SourceMaterial"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'READY',
  ADD COLUMN "extractionMethod" TEXT NOT NULL DEFAULT 'TEXT',
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "processingWarnings" JSONB,
  ADD COLUMN "metadata" JSONB;

CREATE TABLE "SourceChunk" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sourceMaterialId" UUID NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "locator" JSONB NOT NULL,
  "tokenEstimate" INTEGER NOT NULL,
  "embedding" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SourceChunk_sourceMaterialId_chunkIndex_key" ON "SourceChunk"("sourceMaterialId", "chunkIndex");
CREATE INDEX "SourceChunk_sourceMaterialId_chunkIndex_idx" ON "SourceChunk"("sourceMaterialId", "chunkIndex");
CREATE INDEX "SourceChunk_contentHash_idx" ON "SourceChunk"("contentHash");
ALTER TABLE "SourceChunk" ADD CONSTRAINT "SourceChunk_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "SourceMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SourceChunk" (
  "id", "sourceMaterialId", "chunkIndex", "content", "contentHash", "locator", "tokenEstimate"
)
SELECT
  gen_random_uuid(),
  "id",
  0,
  LEFT("content", 1600),
  md5(LEFT("content", 1600)),
  jsonb_build_object('type', 'LEGACY_TEXT', 'section', "title", 'characterStart', 0, 'characterEnd', LEAST(length("content"), 1600)),
  GREATEST(1, CEIL(LEAST(length("content"), 1600) / 4.0)::INTEGER)
FROM "SourceMaterial"
WHERE length(trim("content")) > 0;
