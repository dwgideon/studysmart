import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { databaseTransaction, prisma } from "@/lib/prisma";
import { generateFlashcardsFromText, UnsafeGeneratedContentError } from "@/lib/aiHelpers";
import { requireApiUser } from "@/lib/auth";
import { normalizeConceptName } from "@/lib/mastery";
import formidable from "formidable";
import fs from "fs";
import { createHash } from "crypto";
import { aiAccessForUser, moderateK12Content } from "@/lib/childSafety";
import { isOpenAIConfigured } from "@/lib/openai";
import { isAiFreeTestMode } from "@/lib/aiFreeTestMode";
import {
  ingestStudySource,
  UnsupportedStudyFileError,
} from "@/lib/sourceIngestion";
import { AiCreditLimitError, aiCreditErrorResponse, withAiCredits } from "@/lib/aiCredits";
import { AI_CREDIT_COSTS } from "@/lib/plans";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const AUDIO_OR_VIDEO_TYPES = /^(?:audio|video)\//;
const NATIVE_TEXT_TYPES = new Set(["text/plain", "text/markdown", "text/csv", "application/json", "text/html"]);

export const config = {
  api: {
    bodyParser: false,
  },
};

function fieldValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  if (!isAiFreeTestMode && !isOpenAIConfigured) {
    return res.status(503).json({
      code: "AI_NOT_CONFIGURED",
      error: "Study generation is temporarily unavailable. The deployment is missing its AI service configuration.",
    });
  }

  try {
    const form = formidable({
      multiples: false,
      // Vercel request bodies have a platform ceiling close to this value.
      // Larger production uploads should move to signed direct-to-storage ingestion.
      maxFileSize: MAX_UPLOAD_BYTES,
      maxFieldsSize: 2 * 1024 * 1024,
      allowEmptyFiles: false,
    });
    const [fields, files] = await form.parse(req);

    const userId = user.id;
    const pastedText = fieldValue(fields.text) ?? "";
    const uploaded = files.file?.[0];
    if (!pastedText.trim() && !uploaded?.filepath) {
      return res.status(400).json({ error: "Missing content" });
    }

    const access = isAiFreeTestMode ? null : await aiAccessForUser(userId);
    if (access && !access.allowed) {return res.status(428).json({ error: access.reason });}
    const textLikeUpload = !uploaded || NATIVE_TEXT_TYPES.has(uploaded.mimetype ?? "");
    if (access?.allowed && !access.districtPolicy.multimodalEnabled && !textLikeUpload) {
      return res.status(403).json({
        error: "Your school or district has disabled image, audio, and video processing.",
      });
    }
    const sourceInput = {
      pastedText,
      file: uploaded?.filepath
        ? {
            buffer: fs.readFileSync(uploaded.filepath),
            fileName: uploaded.originalFilename?.trim() || "study-material",
            mimeType: uploaded.mimetype || "application/octet-stream",
          }
        : undefined,
    };
    const uploadMimeType = uploaded?.mimetype ?? "";
    const audioOrVideoUpload = AUDIO_OR_VIDEO_TYPES.test(uploadMimeType);
    const visualOrDocumentUpload = Boolean(uploaded && !NATIVE_TEXT_TYPES.has(uploadMimeType));
    const ingested = isAiFreeTestMode
      ? await ingestStudySource(sourceInput)
      : await withAiCredits(
          {
            userId,
            feature: audioOrVideoUpload ? "SOURCE_AUDIO_VIDEO" : visualOrDocumentUpload ? "SOURCE_MULTIMODAL" : "SOURCE_TEXT",
            model: visualOrDocumentUpload
              ? audioOrVideoUpload
                ? process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe"
                : process.env.OPENAI_MULTIMODAL_MODEL ?? "gpt-4.1-mini"
              : process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
            credits: audioOrVideoUpload
              ? AI_CREDIT_COSTS.audioOrVideoProcessing
              : visualOrDocumentUpload
                ? AI_CREDIT_COSTS.visualOrDocumentProcessing
                : AI_CREDIT_COSTS.textSourceProcessing,
          },
          () => ingestStudySource(sourceInput)
        );
    const content = ingested.content;
    const safety = await moderateK12Content(userId, content, "MATERIAL_UPLOAD");
    if (!safety.allowed) {
      return res.status(safety.lockedUntil ? 423 : 422).json({
        code: safety.lockedUntil ? "LEARNING_LOCKED" : "CONTENT_BLOCKED",
        error: safety.safeResponse,
        strikeCount: safety.strikeCount,
        lockedUntil: safety.lockedUntil,
      });
    }

    const course = await prisma.course.findFirst({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    });

    const flashcards = isAiFreeTestMode
      ? await generateFlashcardsFromText(content, userId)
      : await withAiCredits(
          { userId, feature: "FLASHCARDS", model: "gpt-4o-mini", credits: AI_CREDIT_COSTS.flashcardGeneration },
          () => generateFlashcardsFromText(content, userId)
        );
    if (flashcards.length === 0) {
      return res.status(500).json({ error: "No flashcards generated" });
    }

    const sessionTitle =
      content.trim().slice(0, 72) || "Uploaded study material";
    const sourceTitle =
      uploaded?.originalFilename?.trim() || sessionTitle;

    const result = await databaseTransaction(async (tx) => {
      const sourceMaterial = await tx.sourceMaterial.create({
        data: {
          userId,
          courseId: course?.id ?? null,
          title: sourceTitle.slice(0, 160),
          content: content.trim().slice(0, 100_000),
          sourceType: uploaded ? "UPLOADED_FILE" : "PASTED_TEXT",
          originalFileName: uploaded?.originalFilename ?? null,
          mimeType: uploaded?.mimetype ?? null,
          extractionMethod: ingested.extractionMethod,
          contentHash: createHash("sha256").update(content).digest("hex"),
          processingWarnings: ingested.warnings,
          metadata: ingested.metadata,
          chunks: {
            create: ingested.chunks.map((chunk) => ({
              chunkIndex: chunk.chunkIndex,
              content: chunk.content,
              contentHash: chunk.contentHash,
              locator: chunk.locator,
              tokenEstimate: chunk.tokenEstimate,
              ...(chunk.embedding ? { embedding: chunk.embedding } : {}),
            })),
          },
        },
      });

      const session = await tx.studySession.create({
        data: {
          userId,
          courseId: course?.id ?? null,
          sourceMaterialId: sourceMaterial.id,
          title: sessionTitle,
          totalCards: flashcards.length,
        },
      });

      const concepts = new Map<string, string>();

      if (course) {
        for (const card of flashcards) {
          const normalizedName = normalizeConceptName(card.concept) || "core ideas";
          if (concepts.has(normalizedName)) {
            continue;
          }

          const concept = await tx.concept.upsert({
            where: {
              courseId_normalizedName: {
                courseId: course.id,
                normalizedName,
              },
            },
            create: {
              courseId: course.id,
              name: card.concept || "Core ideas",
              normalizedName,
            },
            update: { name: card.concept || "Core ideas" },
          });

          await tx.conceptMastery.upsert({
            where: { userId_conceptId: { userId, conceptId: concept.id } },
            create: { userId, conceptId: concept.id },
            update: {},
          });
          concepts.set(normalizedName, concept.id);
        }
      }

      await tx.flashcard.createMany({
        data: flashcards.map((card) => ({
          question: card.front,
          answer: card.back,
          userId,
          sessionId: session.id,
          conceptId:
            concepts.get(normalizeConceptName(card.concept) || "core ideas") ?? null,
        })),
      });

      return {
        sessionId: session.id,
        sourceMaterialId: sourceMaterial.id,
        conceptCount: concepts.size,
        extractionMethod: sourceMaterial.extractionMethod,
        warnings: ingested.warnings,
        chunkCount: ingested.chunks.length,
      };
    });

    return res.status(200).json({
      ...result,
      needsLearningProfile: !course,
    });
  } catch (error) {
    if (error instanceof AiCreditLimitError) {
      return res.status(402).json(aiCreditErrorResponse(error));
    }
    if (error instanceof UnsafeGeneratedContentError) {
      return res.status(422).json({ error: error.message });
    }
    if (error instanceof UnsupportedStudyFileError) {
      return res.status(415).json({ error: error.message });
    }
    if (
      error instanceof Error &&
      (error.message.includes("maxFileSize") || error.message.includes("maxTotalFileSize"))
    ) {
      return res.status(413).json({ error: "Study files must be 4 MB or smaller for this release." });
    }
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Generation failed" });
  }
}

export default withApiMonitoring("api.process-materials", handler);
