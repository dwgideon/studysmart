import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { notes } = req.body;

  if (!notes || typeof notes !== "string") {
    return res.status(400).json({ error: "Invalid notes" });
  }

  // 🔮 placeholder for AI processing
  const sessionId = randomUUID();

  // TODO: save notes + generated materials to Supabase here

  return res.status(200).json({
    sessionId,
    flashcards: [
      {
        id: randomUUID(),
        question: "Sample question",
        answer: "Sample answer",
      },
    ],
  });
}
