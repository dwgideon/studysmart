import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable();

    const [fields, files] = await form.parse(req);

    let text = "";

    if (fields.text && typeof fields.text[0] === "string") {
      text = fields.text[0];
    }

    if (files.file && files.file[0]) {
      const file = files.file[0];
      const buffer = fs.readFileSync(file.filepath);
      text += "\n\n" + buffer.toString("utf-8");
    }

    if (!text.trim()) {
      return res.status(400).json({ error: "No content provided" });
    }

    // 👉 For now just echo back success
    return res.status(200).json({
      success: true,
      length: text.length,
    });
  } catch (err) {
    console.error("UPLOAD API ERROR:", err);
    return res.status(500).json({ error: "Upload processing failed" });
  }
}
