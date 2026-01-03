import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { openai } from "@/lib/openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err: any, _fields: any, files: any) => {
    if (err) {
      return res.status(500).json({ error: "File parsing failed." });
    }

    try {
      const file = files.file?.[0];
      if (!file) return res.status(400).json({ error: "No file uploaded." });

      let extractedText = "";

      // PDF
      if (file.mimetype === "application/pdf") {
        const data = fs.readFileSync(file.filepath);
        const parsed = await pdf(data);
        extractedText = parsed.text;
      }

      // Word doc
      else if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({
          path: file.filepath,
        });
        extractedText = result.value;
      }

      // Plain text fallback
      else {
        extractedText = fs.readFileSync(file.filepath, "utf-8");
      }

      if (!extractedText || extractedText.length < 50) {
        return res.status(400).json({ error: "Could not extract readable content." });
      }

      // Send notes to tutor
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              "Summarize the following notes into a clean middle-school-friendly lesson using Markdown formatting and bullet points.",
          },
          {
            role: "user",
            content: extractedText.substring(0, 12_000),
          },
        ],
      });

      res.status(200).json({
        lesson: completion.choices[0].message.content,
      });

    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "AI lesson generation failed." });
    }
  });
}
