import { NextApiRequest, NextApiResponse } from "next";
import formidable, { IncomingForm, File as FormidableFile } from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";
import unzipper from "unzipper";

// Disable Next.js body parser so formidable can handle file streams
export const config = {
  api: {
    bodyParser: false,
  },
};

// Extract text based on file type
async function extractText(filePath: string, mimeType: string): Promise<string> {
  // PDF
  if (mimeType.includes("pdf") || filePath.endsWith(".pdf")) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  // Word
  if (mimeType.includes("word") || filePath.endsWith(".docx")) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Excel
  if (mimeType.includes("spreadsheet") || filePath.endsWith(".xlsx")) {
    const workbook: XLSX.WorkBook = XLSX.read(fs.readFileSync(filePath), { type: "buffer" });
    let text = "";
    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      text += XLSX.utils.sheet_to_csv(sheet);
    });
    return text;
  }

  // PowerPoint
  if (mimeType.includes("presentation") || filePath.endsWith(".pptx")) {
    const slides: string[] = [];
    const directory = await unzipper.Open.file(filePath);
    for (const entry of directory.files) {
      if (entry.path.startsWith("ppt/slides/") && entry.path.endsWith(".xml")) {
        const content = await entry.buffer();
        const text = content.toString("utf-8").replace(/<[^>]+>/g, " ");
        slides.push(text);
      }
    }
    return slides.join("\n");
  }

  // Images (OCR)
  if (mimeType.startsWith("image/")) {
    const { data } = await Tesseract.recognize(filePath, "eng");
    return data.text;
  }

  return "❌ Unsupported file type.";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = new IncomingForm({ multiples: false });

    form.parse(req, async (err: unknown, fields: formidable.Fields, files: formidable.Files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Error parsing file upload" });
      }

      try {
        // Handle uploaded file safely
        const fileArray = Array.isArray(files.file) ? files.file : [files.file];
        const uploadedFile = fileArray[0] as FormidableFile;

        if (!uploadedFile || !uploadedFile.filepath) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = uploadedFile.filepath;
        const mimeType = uploadedFile.mimetype || "";

        const text = await extractText(filePath, mimeType);

        if (!text || text.trim().length === 0) {
          console.warn("⚠️ Extracted empty text.");
          return res.status(400).json({ error: "No readable content extracted" });
        }

        return res.status(200).json({ text });
      } catch (parseError) {
        console.error("File processing error:", parseError);
        return res.status(500).json({ error: "Error processing file" });
      }
    });
  } catch (outerError) {
    console.error("Unexpected error:", outerError);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
