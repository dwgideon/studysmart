// src/pages/api/processMaterials.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

export const config = {
  api: { bodyParser: false },
};

const DEPTH_CONFIG = {
  min: { flashcards: 20, quizQuestions: 10, summaryParas: 1, studyBullets: 5, maxTokens: 800 },
  med: { flashcards: 40, quizQuestions: 20, summaryParas: 2, studyBullets: 10, maxTokens: 1500 },
  max: { flashcards: 80, quizQuestions: 40, summaryParas: 4, studyBullets: 20, maxTokens: 2500 },
} as const;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const form = formidable({ multiples: true });

  form.parse(
  req,
  async (
    err: Error | null,
    fields: Record<string, any>,
    files: Record<string, any>
  ) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Failed to parse form data" });
    }

    const depth = (fields.depth as string) || "med";
    const topic = (fields.topic as string) || "";

    const cfg =
      DEPTH_CONFIG[depth as keyof typeof DEPTH_CONFIG] ??
      DEPTH_CONFIG.med;

    const uploads = files["note-upload"];
    const noteFiles = Array.isArray(uploads)
      ? uploads
      : uploads
      ? [uploads]
      : [];

    const textPieces: string[] = [];

    for (const file of noteFiles as any[]) {
      const buffer = fs.readFileSync(file.filepath);

      if (file.mimetype === "application/pdf") {
        const parsed = await pdfParse(buffer);
        textPieces.push(parsed.text);
      } else {
        textPieces.push(buffer.toString("utf8"));
      }
    }

    const combinedText = textPieces.join("\n\n");

    const prompt = `
You are an expert study-material generator.

Topic: "${topic}"

Return VALID JSON ONLY with:
1) "flashcards" (${cfg.flashcards})
2) "quizQuestions" (${cfg.quizQuestions})
3) "summary" (${cfg.summaryParas} paragraphs)
4) "studyGuide" (${cfg.studyBullets} bullets)

Content:
${combinedText}
`.trim();

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You generate study materials." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: cfg.maxTokens,
      });

      const json = response.choices[0].message.content ?? "{}";
      return res.status(200).json(JSON.parse(json));
    } catch (error: any) {
      console.error("AI generation error:", error);
      return res.status(500).json({
        error: "AI generation failed",
        detail: error.message,
      });
    }
  });
}
