// pages/api/generateQuiz.ts
import { NextApiRequest, NextApiResponse } from "next";
import { generateQuizFromText } from "@/lib/aiHelpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { content } = req.body;
  try {
    const questions = await generateQuizFromText(content);
    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate quiz." });
  }
}
