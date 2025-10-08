// src/pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs/promises";
import { generateFlashcardsFromText, generateQuizFromText } from "@/lib/aiHelpers";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

// fallback types for formidable
type FormidableFields = Record<string, any>;
type FormidableFiles = Record<string, File | File[]>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const form = formidable({ multiples: false });

  form.parse(req, async (err: Error | null, fields: FormidableFields, files: FormidableFiles) => {
    if (err) return res.status(500).json({ error: "File parse failed" });

    try {
      const file = Array.isArray(files.file) ? files.file[0] : (files.file as File);
      const topic = (fields.topic as string) || "Untitled";
      const type = (fields.type as string) || "notes";

      let extractedText = "";

      if (file) {
        const filePath = (file as any).filepath; // TS safe cast
        const buffer = await fs.readFile(filePath);
        extractedText = buffer.toString("utf8").slice(0, 5000);
      } else if (topic) {
        extractedText = topic;
      }

      if (!extractedText) return res.status(400).json({ error: "No text provided" });

      if (type === "quiz") {
        const aiResult = await generateQuizFromText(extractedText);

        const savedQuiz = await prisma.quiz.create({
          data: {
            title: topic,
            questions: {
              create: aiResult.map((q: any) => ({
                question: q.question,
                answer: q.answer,
                options: JSON.stringify(q.options),
              })),
            },
            userId: "test-user",
          },
        });

        return res.status(200).json({ type: "quiz", savedQuiz });
      } else {
        const aiResult = await generateFlashcardsFromText(extractedText);

        const savedFlashcards = await prisma.flashcard.create({
  data: {
    front: "Question?",
    back: "Answer",
    userId: "test-user",
  },
});

        return res.status(200).json({ type: "notes", savedFlashcards });
      }
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  });
}
