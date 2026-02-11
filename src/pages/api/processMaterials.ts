import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Placeholder processing (you will enhance later)
    const flashcards = [
      { question: "Sample Question", answer: "Sample Answer" },
    ];

    res.status(200).json({
      sessionId: "temp-session-id",
      notes: [],
      flashcards,
      quizzes: [],
    });
  } catch (error) {
    console.error("processMaterials error:", error);
    res.status(500).json({
      sessionId: null,
      notes: [],
      flashcards: [],
      quizzes: [],
    });
  }
}
