import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // later: OpenAI generation here

    return res.status(200).json({
      flashcards: [],
      quiz: [],
      studyGuide: "",
    });
  } catch (err) {
    console.error("PROCESS API ERROR:", err);
    return res.status(500).json({ error: "Processing failed" });
  }
}
