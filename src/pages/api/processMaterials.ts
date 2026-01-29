import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No text provided" });
    }

    // ✅ TEMP MOCK DATA — later this is where AI will run
    const materials = {
      flashcards: [
        { question: "Who is Hebrews written to?", answer: "Jewish believers" },
        { question: "Main theme of Hebrews 1?", answer: "Jesus is superior" },
      ],
      quizQuestions: [
        {
          question: "Who is greater: angels or Jesus?",
          answer: "Jesus",
          choices: ["Angels", "Jesus", "Prophets"],
        },
      ],
      summary: "Hebrews 1 teaches that Jesus is greater than angels and fully God.",
      studyGuide: [
        "Jesus is God\n- He created all things\n- He sustains all things",
        "Jesus is greater than angels\n- Angels worship Him\n- He sits on the throne",
      ],
    };

    return res.status(200).json(materials);
  } catch (err) {
    console.error("processMaterials error:", err);
    return res.status(500).json({ error: "Failed to process materials" });
  }
}
